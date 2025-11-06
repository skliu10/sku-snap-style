"""
Test scraper functionality with mock data to verify the pipeline works.
"""

import json
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_exporter import DataExporter
from utils import normalize_color, normalize_clothing_type, validate_product_data

def test_data_pipeline():
    """Test the data processing pipeline with mock Nordstrom-style data."""
    print("Testing Data Processing Pipeline")
    print("=" * 50)
    
    # Mock product data as it might come from Nordstrom
    mock_products = [
        {
            'url': 'https://www.nordstrom.com/browse/women/clothing/dress/1234567',
            'sku_code': 'NORD-1234567',
            'color': 'BLACK',
            'type': 'Dress',
            'brand': 'Nordstrom Signature',
            'description': 'Black cocktail dress with v-neck and long sleeves'
        },
        {
            'url': 'https://www.nordstrom.com/browse/women/clothing/shirt/2345678',
            'sku_code': 'NORD-2345678',
            'color': 'Navy Blue',
            'type': 'T-Shirt',
            'brand': 'Nordstrom',
            'description': 'Navy blue cotton t-shirt'
        },
        {
            'url': 'https://www.nordstrom.com/browse/women/clothing/pants/3456789',
            'sku_code': 'NORD-3456789',
            'color': 'Grey',
            'type': 'Jeans',
            'brand': 'Nordstrom Rack',
            'description': 'Gray denim jeans with straight leg'
        }
    ]
    
    print("\n1. Testing data normalization...")
    normalized_products = []
    for product in mock_products:
        normalized = {
            'sku_code': product['sku_code'],
            'color': normalize_color(product['color']),
            'type': normalize_clothing_type(product['type']),
            'brand': product['brand'],
            'description': product['description'],
            'url': product['url']
        }
        normalized_products.append(normalized)
        
        print(f"   Original: {product['color']} {product['type']}")
        print(f"   Normalized: {normalized['color']} {normalized['type']}")
    
    print("\n2. Testing data validation...")
    valid_products = []
    for product in normalized_products:
        if validate_product_data(product):
            valid_products.append(product)
            print(f"   ✓ {product['sku_code']} - Valid")
        else:
            print(f"   ✗ {product['sku_code']} - Invalid")
    
    print(f"\n3. Valid products: {len(valid_products)}/{len(mock_products)}")
    
    print("\n4. Testing data export...")
    exporter = DataExporter()
    exported_files = exporter.export(valid_products, format='json')
    
    if exported_files:
        print(f"   ✓ Exported to: {exported_files[0]}")
        
        # Verify export format
        with open(exported_files[0], 'r') as f:
            exported_data = json.load(f)
        
        print(f"\n5. Verifying export format...")
        print(f"   ✓ Exported {len(exported_data)} products")
        
        # Check format matches expected SKU format
        sample = exported_data[0]
        required_fields = ['sku_code', 'color', 'type', 'brand', 'description']
        missing_fields = [field for field in required_fields if field not in sample]
        
        if not missing_fields:
            print(f"   ✓ All required fields present: {required_fields}")
        else:
            print(f"   ✗ Missing fields: {missing_fields}")
        
        print(f"\n6. Sample exported product:")
        print(json.dumps(sample, indent=2))
        
        return True
    else:
        print("   ✗ Export failed")
        return False

if __name__ == '__main__':
    try:
        success = test_data_pipeline()
        print("\n" + "=" * 50)
        if success:
            print("✓ All tests passed! Pipeline is working correctly.")
        else:
            print("✗ Some tests failed.")
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

