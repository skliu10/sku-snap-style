"""
Quick test script to verify the scraper works.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import os
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nordstrom_scraper import NordstromScraper

def test_single_product_extraction():
    """Test extracting a single product."""
    print("Testing Nordstrom Scraper...")
    print("=" * 50)
    
    scraper = NordstromScraper(use_selenium=False)
    
    # Test with a Nordstrom product page
    # Using a generic category/search page first to find product URLs
    print("\n1. Testing search functionality...")
    search_urls = scraper.search_products("dress", max_results=3)
    
    if search_urls:
        print(f"   ✓ Found {len(search_urls)} product URLs")
        print(f"   Sample URLs:")
        for i, url in enumerate(search_urls[:2], 1):
            print(f"     {i}. {url}")
        
        print("\n2. Testing product extraction...")
        test_url = search_urls[0]
        print(f"   Extracting from: {test_url}")
        
        product = scraper.extract_product_from_page(test_url)
        
        if product:
            print("\n   ✓ Product extracted successfully!")
            print(f"   Product data:")
            print(json.dumps(product, indent=2))
            return True
        else:
            print("   ✗ Failed to extract product data")
            return False
    else:
        print("   ✗ No product URLs found")
        print("   This might be due to:")
        print("   - Website structure changes")
        print("   - Need to use Selenium for JavaScript content")
        print("   - Network/access issues")
        return False

if __name__ == '__main__':
    try:
        success = test_single_product_extraction()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

