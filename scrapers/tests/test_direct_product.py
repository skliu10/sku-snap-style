"""
Test scraping with a direct product URL to verify extraction works.
This bypasses the search functionality to test the core extraction logic.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import logging
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from nordstrom_scraper import NordstromScraper
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_exporter import DataExporter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def test_direct_product_url():
    """Test scraping a known product URL."""
    print("Testing Direct Product URL Scraping")
    print("=" * 60)
    
    # We'll use a generic product page pattern
    # In reality, you'd use actual product URLs from Nordstrom
    # For testing, we'll try to find a product through the browse page
    
    scraper = NordstromScraper(use_selenium=True)
    
    print("\n1. Navigating to Nordstrom dresses category...")
    print("   (This will help us find actual product URLs)")
    
    # Try to get actual product URLs from the category page
    category_url = "https://www.nordstrom.com/browse/women/dresses"
    
    # Use Selenium to get the page and wait for products to load
    try:
        from selenium_utils import get_page_with_selenium
        from bs4 import BeautifulSoup
        import re
        
        print("   Loading page with Selenium (this may take 10-20 seconds)...")
        html = get_page_with_selenium(category_url, wait_for_selector="body")
        
        if html:
            soup = BeautifulSoup(html, 'lxml')
            
            # Find product links - look for URLs with numeric IDs
            print("\n2. Searching for product links...")
            all_links = soup.find_all('a', href=True)
            product_urls = []
            
            for link in all_links:
                href = link.get('href', '')
                href_clean = href.split('?')[0]  # Remove query parameters
                
                # Look for product URLs with pattern: /s/{slug}/{numeric-id}
                if re.match(r'/s/[^/]+/\d+', href_clean):
                    full_url = f"https://www.nordstrom.com{href}" if href.startswith('/') else href
                    # Filter out non-product pages
                    if 'customer-service' not in full_url and 'policy' not in full_url:
                        if full_url not in product_urls:
                            product_urls.append(full_url)
                            if len(product_urls) >= 3:  # Get 3 products for testing
                                break
            
            if product_urls:
                print(f"   ✓ Found {len(product_urls)} product URLs")
                for i, url in enumerate(product_urls, 1):
                    print(f"     {i}. {url[:80]}...")
                
                print("\n3. Testing product extraction...")
                products = []
                
                for i, url in enumerate(product_urls[:2], 1):  # Test first 2
                    print(f"\n   Product {i}:")
                    print(f"   URL: {url[:70]}...")
                    
                    product = scraper.extract_product_from_page(url)
                    
                    if product:
                        print(f"   ✓ Extracted successfully!")
                        print(f"     SKU: {product.get('sku_code', 'N/A')}")
                        print(f"     Color: {product.get('color', 'N/A')}")
                        print(f"     Type: {product.get('type', 'N/A')}")
                        print(f"     Brand: {product.get('brand', 'N/A')}")
                        desc = product.get('description', 'N/A')
                        print(f"     Description: {desc[:60] if len(desc) > 60 else desc}...")
                        products.append(product)
                    else:
                        print(f"   ✗ Extraction failed")
                
                if products:
                    print(f"\n4. Exporting {len(products)} products...")
                    exporter = DataExporter()
                    exported_files = exporter.export(products, format='json')
                    
                    if exported_files:
                        print(f"   ✓ Exported to: {exported_files[0]}")
                        print(f"\n5. Results Summary:")
                        print(f"   ✓ Successfully scraped {len(products)} products")
                        print(f"\n   Exported data:")
                        with open(exported_files[0], 'r') as f:
                            data = json.load(f)
                            print(json.dumps(data, indent=2))
                        return True
                    else:
                        print("   ✗ Export failed")
                        return False
                else:
                    print("\n   ✗ No products extracted")
                    print("   The page structure may have changed.")
                    print("   Try checking the selectors in nordstrom_scraper.py")
                    return False
            else:
                print("   ✗ No product URLs found")
                print("   The website structure may have changed.")
                return False
        else:
            print("   ✗ Failed to load page")
            return False
            
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    try:
        success = test_direct_product_url()
        print("\n" + "=" * 60)
        if success:
            print("✓ Test completed successfully!")
        else:
            print("✗ Test completed with issues.")
        print("=" * 60)
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)

