"""
Utility functions for web scraping operations.
"""

import time
import random
import re
import logging
from typing import Dict, List, Optional, Any
from retrying import retry
import requests
from bs4 import BeautifulSoup

from config import (
    REQUEST_HEADERS,
    RATE_LIMIT_DELAY_MIN,
    RATE_LIMIT_DELAY_MAX,
    MAX_RETRIES,
    RETRY_BACKOFF_FACTOR,
    RETRY_STATUS_CODES,
    REQUEST_TIMEOUT,
    COLOR_KEYWORDS,
    CLOTHING_TYPES
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def rate_limit_delay():
    """Add random delay to respect rate limits."""
    delay = random.uniform(RATE_LIMIT_DELAY_MIN, RATE_LIMIT_DELAY_MAX)
    time.sleep(delay)


def normalize_color(color_text: str) -> Optional[str]:
    """
    Normalize color text to standard color names.
    
    Args:
        color_text: Raw color text from the website
        
    Returns:
        Normalized color name or None
    """
    if not color_text:
        return None
    
    color_lower = color_text.lower().strip()
    
    # Direct match
    for keyword in COLOR_KEYWORDS:
        if keyword in color_lower:
            # Map variations
            if keyword in ['grey']:
                return 'gray'
            return keyword
    
    # Handle common variations
    color_mapping = {
        'blk': 'black',
        'wht': 'white',
        'blu': 'blue',
        'gry': 'gray',
        'grn': 'green',
        'nvy': 'navy',
        'beg': 'beige',
        'brn': 'brown',
        'brg': 'burgundy',
    }
    
    for abbrev, full in color_mapping.items():
        if abbrev in color_lower:
            return full
    
    return color_lower  # Return as-is if no match found


def normalize_clothing_type(type_text: str) -> Optional[str]:
    """
    Normalize clothing type text to standard types.
    
    Args:
        type_text: Raw type text from the website
        
    Returns:
        Normalized clothing type or None
    """
    if not type_text:
        return None
    
    type_lower = type_text.lower().strip()
    
    # Direct match
    for clothing_type in CLOTHING_TYPES:
        if clothing_type in type_lower:
            # Map variations
            type_mapping = {
                't-shirt': 't-shirt',
                'tshirt': 't-shirt',
                't shirt': 't-shirt',
                'top': 'shirt',  # Generalize tops to shirt
                'trousers': 'pants',
            }
            return type_mapping.get(clothing_type, clothing_type)
    
    return type_lower  # Return as-is if no match found


def extract_sku_from_text(text: str, brand: str = "NORD") -> Optional[str]:
    """
    Extract or generate SKU code from product information.
    
    Args:
        text: Product text that may contain SKU
        brand: Brand prefix for SKU
        
    Returns:
        SKU code or None
    """
    if not text:
        return None
    
    # Look for SKU patterns (numbers, alphanumeric codes)
    sku_patterns = [
        r'SKU[:\s]+([A-Z0-9\-]+)',
        r'Style[:\s]+([A-Z0-9\-]+)',
        r'Item[:\s]+([A-Z0-9\-]+)',
        r'\b([A-Z]{2,}\d{4,})\b',  # Pattern like NORD12345
        r'\b(\d{6,})\b',  # Long numeric codes
    ]
    
    for pattern in sku_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).upper()
    
    return None


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters but keep basic punctuation
    text = re.sub(r'[^\w\s\-\.,!?]', '', text)
    return text.strip()


def validate_product_data(product: Dict[str, Any]) -> bool:
    """
    Validate that product data contains required fields.
    
    Args:
        product: Product dictionary
        
    Returns:
        True if valid, False otherwise
    """
    required_fields = ['sku_code', 'type']
    
    for field in required_fields:
        if not product.get(field):
            logger.warning(f"Product missing required field: {field}")
            return False
    
    # Validate color is in our keyword list if provided
    if product.get('color'):
        color = normalize_color(product['color'])
        if color not in COLOR_KEYWORDS and color not in ['gray', 'grey']:
            logger.debug(f"Color '{color}' not in standard list, but keeping it")
    
    return True


@retry(
    stop_max_attempt_number=MAX_RETRIES,
    wait_exponential_multiplier=1000,
    wait_exponential_max=10000,
    retry_on_exception=lambda e: isinstance(e, (requests.Timeout, requests.ConnectionError))
)
def fetch_page(url: str, use_selenium: bool = False) -> Optional[BeautifulSoup]:
    """
    Fetch a webpage with retry logic.
    
    Args:
        url: URL to fetch
        use_selenium: Whether to use Selenium for JavaScript-heavy pages
        
    Returns:
        BeautifulSoup object or None if failed
    """
    try:
        rate_limit_delay()
        
        if use_selenium:
            try:
                from selenium_utils import get_page_with_selenium
                html = get_page_with_selenium(url)
                if html:
                    return BeautifulSoup(html, 'lxml')
                return None
            except ImportError:
                logger.error("Selenium not available. Install selenium and webdriver-manager.")
                return None
        
        response = requests.get(
            url,
            headers=REQUEST_HEADERS,
            timeout=REQUEST_TIMEOUT
        )
        
        # Check for rate limiting
        if response.status_code == 429:
            logger.warning(f"Rate limited. Waiting longer before retry...")
            time.sleep(5)
            raise requests.exceptions.HTTPError("Rate limited")
        
        response.raise_for_status()
        return BeautifulSoup(response.content, 'lxml')
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching {url}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error fetching {url}: {str(e)}")
        return None

