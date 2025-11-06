"""
Example script demonstrating how to use the Nordstrom scraper.

Usage:
    python scripts/example.py
    # Or from scrapers directory:
    python -m scripts.example
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nordstrom_scraper import NordstromScraper
from data_exporter import DataExporter
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def example_search():
    """Example: Search for products and scrape them."""
    print("Example 1: Searching for 'black dress' products...")
    
    scraper = NordstromScraper(use_selenium=False)
    exporter = DataExporter()
    
    # Search for products
    product_urls = scraper.search_products("black dress", max_results=5)
    print(f"Found {len(product_urls)} product URLs")
    
    # Scrape products
    products = scraper.scrape_product_urls(product_urls)
    print(f"Successfully scraped {len(products)} products")
    
    # Export to JSON
    if products:
        exported_files = exporter.export(products, format='json')
        print(f"Exported to: {exported_files[0]}")


def example_single_product():
    """Example: Scrape a single product by URL."""
    print("\nExample 2: Scraping a single product...")
    
    scraper = NordstromScraper(use_selenium=False)
    
    # Example product URL (replace with actual Nordstrom product URL)
    product_url = "https://www.nordstrom.com/browse/women/clothing/dress"
    
    product = scraper.extract_product_from_page(product_url)
    if product:
        print(f"Product: {product.get('description')}")
        print(f"SKU: {product.get('sku_code')}")
        print(f"Color: {product.get('color')}")
        print(f"Type: {product.get('type')}")
        print(f"Brand: {product.get('brand')}")


def example_category():
    """Example: Scrape products from a category page."""
    print("\nExample 3: Scraping a category page...")
    
    scraper = NordstromScraper(use_selenium=False)
    exporter = DataExporter()
    
    # Example category URL
    category_url = "https://www.nordstrom.com/browse/women/dresses"
    
    products = scraper.scrape_category(category_url, max_products=10)
    print(f"Successfully scraped {len(products)} products from category")
    
    # Export to both JSON and CSV
    if products:
        exported_files = exporter.export(products, format='both')
        print(f"Exported to: {', '.join(exported_files)}")


if __name__ == '__main__':
    print("Nordstrom Scraper Examples")
    print("=" * 50)
    
    # Uncomment the example you want to run:
    # example_search()
    # example_single_product()
    # example_category()
    
    print("\nNote: Uncomment the example functions above to run them.")
    print("Make sure to update URLs with actual Nordstrom product pages.")

