"""
Main script for scraping Nordstrom product data.
"""

import argparse
import logging
import sys
from typing import List

from nordstrom_scraper import NordstromScraper
from data_exporter import DataExporter

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def scrape_by_search(query: str, max_results: int = 50, use_selenium: bool = False):
    """Scrape products by search query."""
    scraper = NordstromScraper(use_selenium=use_selenium)
    exporter = DataExporter()
    
    logger.info(f"Searching for: {query}")
    product_urls = scraper.search_products(query, max_results=max_results)
    
    if not product_urls:
        logger.warning("No products found")
        return
    
    logger.info(f"Found {len(product_urls)} products. Starting extraction...")
    products = scraper.scrape_product_urls(product_urls)
    
    if products:
        exported_files = exporter.export(products, format='both')
        logger.info(f"Successfully scraped {len(products)} products")
        logger.info(f"Exported to: {', '.join(exported_files)}")
    else:
        logger.warning("No products were successfully extracted")


def scrape_by_category(category_url: str, max_products: int = 100, use_selenium: bool = False):
    """Scrape products from a category page."""
    scraper = NordstromScraper(use_selenium=use_selenium)
    exporter = DataExporter()
    
    logger.info(f"Scraping category: {category_url}")
    products = scraper.scrape_category(category_url, max_products=max_products)
    
    if products:
        exported_files = exporter.export(products, format='both')
        logger.info(f"Successfully scraped {len(products)} products")
        logger.info(f"Exported to: {', '.join(exported_files)}")
    else:
        logger.warning("No products were successfully extracted")


def scrape_by_urls(urls: List[str], use_selenium: bool = False):
    """Scrape products from a list of URLs."""
    scraper = NordstromScraper(use_selenium=use_selenium)
    exporter = DataExporter()
    
    logger.info(f"Scraping {len(urls)} product URLs...")
    products = scraper.scrape_product_urls(urls)
    
    if products:
        exported_files = exporter.export(products, format='both')
        logger.info(f"Successfully scraped {len(products)} products")
        logger.info(f"Exported to: {', '.join(exported_files)}")
    else:
        logger.warning("No products were successfully extracted")


def main():
    """Main entry point for the scraper."""
    parser = argparse.ArgumentParser(
        description='Scrape product data from Nordstrom website',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Search for products
  python main.py --search "black dress" --max-results 20
  
  # Scrape a category page
  python main.py --category "https://www.nordstrom.com/browse/women/dresses" --max-products 50
  
  # Scrape specific product URLs
  python main.py --urls "https://www.nordstrom.com/..." "https://www.nordstrom.com/..."
  
  # Use Selenium for JavaScript-heavy pages
  python main.py --search "jeans" --use-selenium
        """
    )
    
    parser.add_argument(
        '--search',
        type=str,
        help='Search query for products'
    )
    
    parser.add_argument(
        '--category',
        type=str,
        help='Category page URL to scrape'
    )
    
    parser.add_argument(
        '--urls',
        nargs='+',
        help='List of product URLs to scrape'
    )
    
    parser.add_argument(
        '--max-results',
        type=int,
        default=50,
        help='Maximum number of search results (default: 50)'
    )
    
    parser.add_argument(
        '--max-products',
        type=int,
        default=100,
        help='Maximum number of products to scrape from category (default: 100)'
    )
    
    parser.add_argument(
        '--use-selenium',
        action='store_true',
        help='Use Selenium for JavaScript-rendered content'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if not any([args.search, args.category, args.urls]):
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.search:
            scrape_by_search(args.search, args.max_results, args.use_selenium)
        elif args.category:
            scrape_by_category(args.category, args.max_products, args.use_selenium)
        elif args.urls:
            scrape_by_urls(args.urls, args.use_selenium)
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error during scraping: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()

