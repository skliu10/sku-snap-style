"""
Test script for live scraping with Selenium.
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

# Setup detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_selenium_scraping():
    """Test scraping with Selenium."""
    print("Testing Live Scraping with Selenium")
    print("=" * 60)
    
    try:
        # Initialize scraper with Selenium
        print("\n1. Initializing scraper with Selenium...")
        scraper = NordstromScraper(use_selenium=True)
        print("   ✓ Scraper initialized")
        
        # Test 1: Try to fetch a category page
        print("\n2. Testing category page scraping...")
        category_url = "https://www.nordstrom.com/browse/women/dresses"
        print(f"   Fetching: {category_url}")
        
        # Get a few product URLs first
        print("   Searching for products...")
        product_urls = scraper.search_products("dress", max_results=3)
        
        if product_urls:
            print(f"   ✓ Found {len(product_urls)} product URLs")
            for i, url in enumerate(product_urls[:3], 1):
                print(f"     {i}. {url[:80]}...")
            
            # Test 2: Extract product data
            print("\n3. Testing product data extraction...")
            products = []
            
            for i, url in enumerate(product_urls[:2], 1):  # Test with first 2 products
                print(f"\n   Product {i}/{min(2, len(product_urls))}:")
                print(f"   URL: {url[:70]}...")
                
                product = scraper.extract_product_from_page(url)
                
                if product:
                    print(f"   ✓ Successfully extracted product data")
                    print(f"     - SKU: {product.get('sku_code', 'N/A')}")
                    print(f"     - Color: {product.get('color', 'N/A')}")
                    print(f"     - Type: {product.get('type', 'N/A')}")
                    print(f"     - Brand: {product.get('brand', 'N/A')}")
                    print(f"     - Description: {product.get('description', 'N/A')[:60]}...")
                    products.append(product)
                else:
                    print(f"   ✗ Failed to extract product data")
            
            # Test 3: Export data
            if products:
                print(f"\n4. Testing data export...")
                exporter = DataExporter()
                exported_files = exporter.export(products, format='json')
                
                if exported_files:
                    print(f"   ✓ Exported {len(products)} products to: {exported_files[0]}")
                    
                    # Display results
                    print(f"\n5. Final Results:")
                    print(f"   ✓ Successfully scraped {len(products)} products")
                    print(f"\n   Exported data preview:")
                    with open(exported_files[0], 'r') as f:
                        data = json.load(f)
                        print(json.dumps(data, indent=2))
                    
                    return True
                else:
                    print("   ✗ Export failed")
                    return False
            else:
                print("\n   ✗ No products were successfully extracted")
                print("   This might be due to:")
                print("   - Website structure changes")
                print("   - Selectors need updating")
                print("   - Rate limiting or access restrictions")
                return False
        else:
            print("   ✗ No product URLs found")
            print("   Possible reasons:")
            print("   - Website structure has changed")
            print("   - Need to wait longer for JavaScript to load")
            print("   - Access restrictions or CAPTCHA")
            return False
            
    except Exception as e:
        print(f"\n✗ Error during Selenium scraping: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("Nordstrom Live Scraping Test with Selenium")
    print("=" * 60)
    print("\nNote: This test will:")
    print("  1. Open a Chrome browser (may appear briefly)")
    print("  2. Navigate to Nordstrom website")
    print("  3. Extract product data")
    print("  4. Export to JSON\n")
    
    try:
        success = test_selenium_scraping()
        print("\n" + "=" * 60)
        if success:
            print("✓ Test completed successfully!")
        else:
            print("✗ Test completed with issues. Check logs above.")
        print("=" * 60)
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nFatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

