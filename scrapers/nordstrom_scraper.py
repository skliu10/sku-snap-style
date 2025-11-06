"""
Nordstrom web scraper for extracting product information.
Supports both static HTML parsing and JavaScript-rendered content.
"""

import re
import json
import logging
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse, parse_qs
import requests
from bs4 import BeautifulSoup

from config import (
    NORDSTROM_BASE_URL,
    NORDSTROM_SEARCH_URL,
    COLOR_KEYWORDS,
    CLOTHING_TYPES
)
from utils import (
    fetch_page,
    normalize_color,
    normalize_clothing_type,
    extract_sku_from_text,
    clean_text,
    validate_product_data,
    rate_limit_delay
)

logger = logging.getLogger(__name__)


class NordstromScraper:
    """Scraper for Nordstrom website product data."""
    
    def __init__(self, use_selenium: bool = False):
        """
        Initialize the Nordstrom scraper.
        
        Args:
            use_selenium: Whether to use Selenium for JavaScript-rendered content
        """
        self.use_selenium = use_selenium
        self.base_url = NORDSTROM_BASE_URL
        self.session = requests.Session()
        self.scraped_products = []
    
    def extract_product_from_page(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Extract product information from a Nordstrom product page.
        
        Args:
            url: Product page URL
            
        Returns:
            Product dictionary or None if extraction failed
        """
        try:
            logger.info(f"Extracting product from: {url}")
            
            # Try with requests first, fallback to Selenium if needed
            soup = fetch_page(url, use_selenium=self.use_selenium)
            if not soup:
                if not self.use_selenium:
                    # Try with Selenium as fallback
                    try:
                        from selenium_utils import get_page_with_selenium
                        logger.info("Attempting with Selenium...")
                        html = get_page_with_selenium(url, wait_for_selector="[data-product-id]")
                        if html:
                            soup = BeautifulSoup(html, 'lxml')
                        else:
                            return None
                    except ImportError:
                        logger.warning("Selenium not available. Cannot use as fallback.")
                        return None
                else:
                    return None
            
            product = {
                'url': url,
                'brand': 'Nordstrom',
                'sku_code': None,
                'item_number': None,  # Nordstrom Item #
                'color': None,
                'type': None,
                'description': None
            }
            
            # Extract product ID from URL or page
            product_id = self._extract_product_id(url, soup)
            if product_id:
                product['sku_code'] = f"NORD-{product_id}"
            
            # Extract product title/name
            title = self._extract_title(soup)
            if title:
                product['description'] = clean_text(title)
            
            # Extract color information
            color = self._extract_color(soup, title)
            if color:
                product['color'] = normalize_color(color)
            
            # Extract clothing type
            clothing_type = self._extract_type(soup, title)
            if clothing_type:
                product['type'] = normalize_clothing_type(clothing_type)
            
            # Extract brand if available
            brand = self._extract_brand(soup)
            if brand:
                product['brand'] = clean_text(brand)
            
            # Extract SKU from product details
            sku = self._extract_sku(soup)
            if sku:
                product['sku_code'] = sku
            
            # Extract Item # (Nordstrom's internal item number)
            item_number = self._extract_item_number(soup)
            if item_number:
                product['item_number'] = item_number
            
            # Extract additional description details
            description = self._extract_description(soup)
            if description and not product.get('description'):
                product['description'] = clean_text(description)
            
            # Validate product data
            if validate_product_data(product):
                return product
            else:
                logger.warning(f"Product validation failed for {url}")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting product from {url}: {str(e)}")
            return None
    
    def _extract_product_id(self, url: str, soup: BeautifulSoup) -> Optional[str]:
        """Extract product ID from URL or page data."""
        # Try URL first - check for /s/{slug}/{id} pattern
        url_match = re.search(r'/s/[^/]+/(\d+)', url)
        if url_match:
            return url_match.group(1)
        
        # Try legacy /browse/ pattern
        url_match = re.search(r'/browse/[^/]+/[^/]+/(\d+)', url)
        if url_match:
            return url_match.group(1)
        
        # Try data attributes
        product_elem = soup.find(attrs={'data-product-id': True})
        if product_elem:
            return product_elem.get('data-product-id')
        
        # Try script tags with product data
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and 'productID' in data:
                    return str(data['productID'])
                if isinstance(data, dict) and 'sku' in data:
                    return str(data['sku'])
            except (json.JSONDecodeError, AttributeError):
                continue
        
        return None
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract product title."""
        # Try multiple selectors for product title
        title_selectors = [
            'h1[itemprop="name"]',
            'h1.product-title',
            'h1[data-testid="product-title"]',
            'h1',
            '.product-title',
            '[data-product-title]'
        ]
        
        for selector in title_selectors:
            title_elem = soup.select_one(selector)
            if title_elem:
                return title_elem.get_text()
        
        # Try JSON-LD
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and 'name' in data:
                    return data['name']
            except (json.JSONDecodeError, AttributeError):
                continue
        
        return None
    
    def _extract_color(self, soup: BeautifulSoup, title: Optional[str] = None) -> Optional[str]:
        """Extract product color."""
        # Search in title first
        if title:
            for color in COLOR_KEYWORDS:
                if color in title.lower():
                    return color
        
        # Try color selector/dropdown
        color_selectors = [
            '[data-color-name]',
            '.color-option',
            '.product-color',
            '[data-testid="color"]',
            'span:contains("Color")',
        ]
        
        for selector in color_selectors:
            if ':contains' in selector:
                # Handle contains selector differently
                color_elem = soup.find('span', string=re.compile('Color', re.I))
                if color_elem:
                    parent = color_elem.find_parent()
                    if parent:
                        text = parent.get_text()
                        for color in COLOR_KEYWORDS:
                            if color in text.lower():
                                return color
            else:
                color_elem = soup.select_one(selector)
                if color_elem:
                    color_text = color_elem.get_text() or color_elem.get('data-color-name')
                    if color_text:
                        for color in COLOR_KEYWORDS:
                            if color in color_text.lower():
                                return color
                        return color_text.strip()
        
        # Try product details/description
        detail_text = soup.get_text()
        for color in COLOR_KEYWORDS:
            if color in detail_text.lower():
                return color
        
        return None
    
    def _extract_type(self, soup: BeautifulSoup, title: Optional[str] = None) -> Optional[str]:
        """Extract clothing type."""
        # Search in title first
        if title:
            for clothing_type in CLOTHING_TYPES:
                if clothing_type in title.lower():
                    return clothing_type
        
        # Try breadcrumbs or navigation
        breadcrumbs = soup.find_all(['nav', 'ol', 'ul'], class_=re.compile('breadcrumb', re.I))
        for breadcrumb in breadcrumbs:
            text = breadcrumb.get_text()
            for clothing_type in CLOTHING_TYPES:
                if clothing_type in text.lower():
                    return clothing_type
        
        # Try category/type selectors
        type_selectors = [
            '[data-product-type]',
            '.product-category',
            '.product-type',
            '[data-testid="category"]'
        ]
        
        for selector in type_selectors:
            type_elem = soup.select_one(selector)
            if type_elem:
                type_text = type_elem.get_text() or type_elem.get('data-product-type')
                if type_text:
                    for clothing_type in CLOTHING_TYPES:
                        if clothing_type in type_text.lower():
                            return clothing_type
                    return type_text.strip()
        
        return None
    
    def _extract_brand(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract product brand."""
        brand_selectors = [
            '[itemprop="brand"]',
            '.product-brand',
            '[data-testid="brand"]',
            '[data-brand]'
        ]
        
        for selector in brand_selectors:
            brand_elem = soup.select_one(selector)
            if brand_elem:
                brand = brand_elem.get_text() or brand_elem.get('data-brand')
                if brand:
                    return brand.strip()
        
        # Try JSON-LD
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and 'brand' in data:
                    brand_data = data['brand']
                    if isinstance(brand_data, dict) and 'name' in brand_data:
                        return brand_data['name']
                    elif isinstance(brand_data, str):
                        return brand_data
            except (json.JSONDecodeError, AttributeError):
                continue
        
        return None
    
    def _extract_sku(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract SKU code."""
        # Try SKU selectors
        sku_selectors = [
            '[data-sku]',
            '.product-sku',
            '[data-testid="sku"]',
            'span:contains("SKU")',
            'span:contains("Style")'
        ]
        
        for selector in sku_selectors:
            if ':contains' in selector:
                sku_elem = soup.find('span', string=re.compile('(SKU|Style)', re.I))
                if sku_elem:
                    parent = sku_elem.find_parent()
                    if parent:
                        text = parent.get_text()
                        sku = extract_sku_from_text(text)
                        if sku:
                            return sku
            else:
                sku_elem = soup.select_one(selector)
                if sku_elem:
                    sku = sku_elem.get_text() or sku_elem.get('data-sku')
                    if sku:
                        return sku.strip()
        
        return None
    
    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract product description."""
        desc_selectors = [
            '[itemprop="description"]',
            '.product-description',
            '.product-details',
            '[data-testid="description"]'
        ]
        
        for selector in desc_selectors:
            desc_elem = soup.select_one(selector)
            if desc_elem:
                return desc_elem.get_text()
        
        return None
    
    def _extract_item_number(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract Nordstrom Item # from product page."""
        # Method 1: Look for "Item #" or "Item Number" text patterns
        page_text = soup.get_text()
        
        # Pattern: "Item # 12345678" or "Item Number: 12345678"
        item_patterns = [
            r'Item\s*[#:]?\s*(\d{6,})',  # Item # 12345678
            r'Item\s*Number[:\s]+(\d{6,})',  # Item Number: 12345678
            r'Item\s*ID[:\s]+(\d{6,})',  # Item ID: 12345678
        ]
        
        for pattern in item_patterns:
            match = re.search(pattern, page_text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        # Method 2: Look for specific HTML elements containing Item #
        # Check for elements with "Item" text and numbers nearby
        item_elements = soup.find_all(string=re.compile(r'Item\s*[#:]?\s*\d+', re.I))
        for elem in item_elements:
            text = elem.strip()
            match = re.search(r'Item\s*[#:]?\s*(\d{6,})', text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        # Method 3: Check parent elements
        for elem in item_elements:
            parent = elem.parent
            if parent:
                parent_text = parent.get_text()
                match = re.search(r'Item\s*[#:]?\s*(\d{6,})', parent_text, re.IGNORECASE)
                if match:
                    return match.group(1)
        
        # Method 4: Look in specific selectors
        item_selectors = [
            '[data-item-number]',
            '[data-item-id]',
            '.item-number',
            '.product-item-number',
            '[class*="item-number"]'
        ]
        
        for selector in item_selectors:
            elem = soup.select_one(selector)
            if elem:
                item_num = elem.get_text() or elem.get('data-item-number') or elem.get('data-item-id')
                if item_num:
                    # Extract just the number
                    match = re.search(r'(\d{6,})', str(item_num))
                    if match:
                        return match.group(1)
        
        return None
    
    def search_products(self, query: str, max_results: int = 50) -> List[str]:
        """
        Search for products and return product URLs.
        
        Args:
            query: Search query
            max_results: Maximum number of products to return
            
        Returns:
            List of product URLs
        """
        try:
            search_url = f"{NORDSTROM_SEARCH_URL}?keyword={query}"
            logger.info(f"Searching for: {query}")
            
            soup = fetch_page(search_url, use_selenium=self.use_selenium)
            if not soup:
                return []
            
            product_urls = []
            
            # Find product links - Nordstrom product URLs use /s/{slug}/{product-id} pattern
            # Examples: /s/astr-maeve-midi-dress/7737947
            #           /s/xscape-evenings-ruffle-off-the-shoulder-scuba-knit-cocktail-dress/7746484
            all_links = soup.find_all('a', href=True)
            
            for link in all_links:
                href = link.get('href', '')
                if not href:
                    continue
                
                # Check for product URL pattern: /s/{slug}/{numeric-id}
                href_clean = href.split('?')[0]  # Remove query parameters
                
                # Pattern: /s/ followed by slug and numeric ID
                if re.match(r'/s/[^/]+/\d+', href_clean):
                    full_url = urljoin(self.base_url, href)
                    
                    # Filter out non-product pages
                    excluded_patterns = [
                        '/customer-service/',
                        '/policy/',
                        '/help/',
                        '/about/',
                        '/store-locator',
                        '/nordy-club/'
                    ]
                    
                    if not any(pattern in full_url.lower() for pattern in excluded_patterns):
                        if full_url not in product_urls:
                            product_urls.append(full_url)
                            if len(product_urls) >= max_results:
                                return product_urls
                
                # Also check for /browse/ pattern with numeric ID (legacy format)
                elif '/browse/' in href and re.search(r'/\d+$', href_clean):
                    full_url = urljoin(self.base_url, href)
                    excluded_patterns = [
                        '/customer-service/',
                        '/policy/',
                        '/sale?',
                        '/promotions',
                        '/help/',
                        '/about/',
                        '/store-locator'
                    ]
                    
                    if not any(pattern in full_url.lower() for pattern in excluded_patterns):
                        if full_url not in product_urls:
                            product_urls.append(full_url)
                            if len(product_urls) >= max_results:
                                return product_urls
            
            # If no product URLs found with numeric IDs, try alternative patterns
            if not product_urls:
                # Try to find links with data attributes
                for link in soup.find_all('a', attrs={'data-product-id': True}):
                    product_id = link.get('data-product-id')
                    if product_id:
                        # Construct product URL (this is a fallback)
                        product_url = f"{self.base_url}/browse/women/clothing/item/{product_id}"
                        if product_url not in product_urls:
                            product_urls.append(product_url)
                            if len(product_urls) >= max_results:
                                return product_urls
            
            return product_urls
            
        except Exception as e:
            logger.error(f"Error searching products: {str(e)}")
            return []
    
    def scrape_category(self, category_url: str, max_products: int = 100) -> List[Dict[str, Any]]:
        """
        Scrape products from a category page.
        
        Args:
            category_url: Category page URL
            max_products: Maximum number of products to scrape
            
        Returns:
            List of product dictionaries
        """
        products = []
        product_urls = []
        
        try:
            # Get initial page
            soup = fetch_page(category_url, use_selenium=self.use_selenium)
            if not soup:
                return products
            
            # Extract product URLs from page - use same logic as search_products
            all_links = soup.find_all('a', href=True)
            
            for link in all_links:
                href = link.get('href', '')
                if not href:
                    continue
                
                href_clean = href.split('?')[0]  # Remove query parameters
                
                # Check for product URL pattern: /s/{slug}/{numeric-id}
                if re.match(r'/s/[^/]+/\d+', href_clean):
                    full_url = urljoin(self.base_url, href)
                    
                    # Filter out non-product pages
                    excluded_patterns = [
                        '/customer-service/',
                        '/policy/',
                        '/help/',
                        '/about/',
                        '/store-locator',
                        '/nordy-club/'
                    ]
                    
                    if not any(pattern in full_url.lower() for pattern in excluded_patterns):
                        if full_url not in product_urls:
                            product_urls.append(full_url)
                            if len(product_urls) >= max_products:
                                break
            
            # Scrape each product
            for i, url in enumerate(product_urls[:max_products]):
                logger.info(f"Scraping product {i+1}/{min(len(product_urls), max_products)}")
                product = self.extract_product_from_page(url)
                if product:
                    products.append(product)
                rate_limit_delay()
            
            return products
            
        except Exception as e:
            logger.error(f"Error scraping category: {str(e)}")
            return products
    
    def scrape_product_urls(self, urls: List[str]) -> List[Dict[str, Any]]:
        """
        Scrape multiple product URLs.
        
        Args:
            urls: List of product URLs to scrape
            
        Returns:
            List of product dictionaries
        """
        products = []
        
        for i, url in enumerate(urls):
            logger.info(f"Scraping product {i+1}/{len(urls)}")
            product = self.extract_product_from_page(url)
            if product:
                products.append(product)
            rate_limit_delay()
        
        return products

