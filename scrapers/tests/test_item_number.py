"""
Quick test to see where Item # appears on Nordstrom product pages.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from selenium_utils import get_page_with_selenium
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from bs4 import BeautifulSoup
import re

def find_item_number():
    """Test extracting Item # from a product page."""
    url = "https://www.nordstrom.com/s/astr-maeve-midi-dress/7737947"
    
    print(f"Fetching product page: {url}")
    html = get_page_with_selenium(url, wait_for_selector="body")
    
    if html:
        soup = BeautifulSoup(html, 'lxml')
        
        # Save HTML for inspection
        with open('product_page_debug.html', 'w', encoding='utf-8') as f:
            f.write(html[:50000])  # First 50k chars
        
        print("\nSearching for Item # patterns...")
        
        # Look for "Item #" or "Item Number" text
        all_text = soup.get_text()
        
        # Search for patterns
        patterns = [
            r'Item\s*[#:]?\s*(\d+)',
            r'Item\s*Number[:\s]+(\d+)',
            r'Style\s*[#:]?\s*(\d+)',
            r'Product\s*ID[:\s]+(\d+)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, all_text, re.IGNORECASE)
            if matches:
                print(f"  Found with pattern '{pattern}': {matches[:5]}")
        
        # Look in specific elements
        print("\nChecking specific HTML elements...")
        
        # Look for spans/divs containing "Item"
        item_elements = soup.find_all(string=re.compile('Item', re.I))
        for elem in item_elements[:10]:
            parent = elem.parent
            if parent:
                text = parent.get_text()
                if 'item' in text.lower() and any(char.isdigit() for char in text):
                    print(f"  Found: {text[:100]}")
        
        # Look for data attributes
        print("\nChecking data attributes...")
        for elem in soup.find_all(attrs={'data-item-id': True}):
            print(f"  data-item-id: {elem.get('data-item-id')}")
        
        for elem in soup.find_all(attrs={'data-product-id': True}):
            print(f"  data-product-id: {elem.get('data-product-id')}")
        
        for elem in soup.find_all(attrs={'data-style-id': True}):
            print(f"  data-style-id: {elem.get('data-style-id')}")
        
        # Check JSON-LD structured data
        print("\nChecking JSON-LD data...")
        scripts = soup.find_all('script', type='application/ld+json')
        for script in scripts:
            if script.string:
                if 'sku' in script.string.lower() or 'item' in script.string.lower():
                    print(f"  Found JSON-LD with item/sku data")
                    # Try to parse
                    import json
                    try:
                        data = json.loads(script.string)
                        if isinstance(data, dict):
                            print(f"    Keys: {list(data.keys())}")
                            if 'sku' in data:
                                print(f"    SKU: {data['sku']}")
                    except:
                        pass

if __name__ == '__main__':
    find_item_number()

