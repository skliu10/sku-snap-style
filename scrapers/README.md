# Nordstrom Web Scraper

A comprehensive web scraping solution for extracting product data from Nordstrom's website. This scraper extracts SKU codes (Item #), colors, clothing types, brands, and descriptions to populate the retailer SKU database.

**Note**: The `sku_code` field contains Nordstrom's Item #, which is their official SKU number.

## 📁 Project Structure

```
scrapers/
├── main.py                 # Main entry point CLI
├── nordstrom_scraper.py    # Core scraping logic
├── data_exporter.py        # Data export functionality
├── utils.py                # Utility functions
├── selenium_utils.py       # Selenium helpers
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── tests/                  # Test files
│   ├── test_scraper.py
│   ├── test_selenium.py
│   └── ...
├── docs/                   # Documentation
│   ├── QUICKSTART.md
│   ├── INTEGRATION.md
│   └── ...
├── scripts/                # Example scripts
│   └── example.py
└── scraped_data/           # Output directory (auto-created)
```

## Features

- **Multiple Scraping Methods**: Supports requests/BeautifulSoup for static content and Selenium for JavaScript-rendered pages
- **Intelligent Data Extraction**: Automatically extracts and normalizes product information
- **Rate Limiting**: Built-in rate limiting to respect website policies
- **Error Handling**: Robust retry logic with exponential backoff
- **Data Validation**: Validates extracted data before export
- **Multiple Export Formats**: Exports to JSON (compatible with SKU format) and CSV
- **Flexible Input Options**: Supports search queries, category pages, or direct product URLs

## Installation

1. **Install Python Dependencies**

```bash
cd scrapers
pip install -r requirements.txt
```

2. **Install ChromeDriver** (for Selenium support)

ChromeDriver will be automatically downloaded by `webdriver-manager`, but you can also install it manually:
- macOS: `brew install chromedriver`
- Linux: Download from [ChromeDriver downloads](https://chromedriver.chromium.org/)
- Windows: Download from [ChromeDriver downloads](https://chromedriver.chromium.org/)

3. **Optional: Configure API Keys**

If you want to use Firecrawl or Jina for advanced scraping:

```bash
cp .env.example .env
# Edit .env and add your API keys
```

## Usage

### Basic Usage

#### Search for Products

```bash
python main.py --search "black dress" --max-results 20
```

#### Scrape a Category Page

```bash
python main.py --category "https://www.nordstrom.com/browse/women/dresses" --max-products 50
```

#### Scrape Specific Product URLs

```bash
python main.py --urls "https://www.nordstrom.com/browse/women/clothing/dress/..." "https://www.nordstrom.com/..."
```

### Advanced Usage

#### Use Selenium for JavaScript-Rendered Content

```bash
python main.py --search "jeans" --use-selenium
```

#### Customize Output Format

Modify `config.py` to change default export format or output directory.

### Python API Usage

You can also use the scraper programmatically:

```python
from nordstrom_scraper import NordstromScraper
from data_exporter import DataExporter

# Initialize scraper
scraper = NordstromScraper(use_selenium=False)

# Search for products
product_urls = scraper.search_products("black dress", max_results=20)

# Scrape products
products = scraper.scrape_product_urls(product_urls)

# Export data
exporter = DataExporter()
exporter.export(products, format='json')
```

## Output Format

The scraper exports data in a format compatible with the SKU database:

```json
[
  {
    "sku_code": "NORD-1234567",
    "color": "black",
    "type": "dress",
    "brand": "Nordstrom",
    "description": "Black cocktail dress with v-neck"
  }
]
```

## Configuration

Edit `config.py` to customize:

- **Rate Limiting**: Adjust delays between requests
- **Retry Logic**: Configure retry attempts and backoff
- **Timeout Settings**: Set request and page load timeouts
- **Selenium Settings**: Configure headless mode and wait times
- **Output Settings**: Change output directory and format

## Best Practices

1. **Respect Rate Limits**: The scraper includes built-in rate limiting. Don't modify delays to be too aggressive.

2. **Use Selenium Sparingly**: Selenium is slower than requests. Only use it when necessary for JavaScript-rendered content.

3. **Check Robots.txt**: Always respect Nordstrom's robots.txt file.

4. **Handle Errors Gracefully**: The scraper includes error handling, but monitor logs for issues.

5. **Validate Data**: Review exported data before importing into the database.

## Troubleshooting

### Common Issues

1. **No products found**
   - Check if the website structure has changed
   - Try using `--use-selenium` flag
   - Verify the URL or search query is correct

2. **Selenium errors**
   - Ensure ChromeDriver is installed and up to date
   - Check Chrome browser version compatibility
   - Try running without headless mode for debugging

3. **Rate limiting**
   - Increase delays in `config.py`
   - Reduce `--max-results` or `--max-products`
   - Wait before running another scrape

4. **Missing data fields**
   - Nordstrom's website structure may vary
   - Some products may not have all fields available
   - Check scraped_data directory for partial results


## Ethical Considerations

- **Respect Terms of Service**: Review Nordstrom's Terms of Service before scraping
- **Rate Limiting**: Use appropriate delays to avoid overloading servers
- **Personal Use**: This scraper is intended for personal/educational use
- **Data Usage**: Only use scraped data for legitimate purposes

## Advanced Features

### Using Firecrawl (Optional)

If you have a Firecrawl API key, you can integrate it for more advanced crawling:

```python
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="your-api-key")
result = app.scrape_url("https://www.nordstrom.com/...")
```

### Using Jina (Optional)

For AI-driven data structuring:

```python
from jina import Client

client = Client(api_key="your-api-key")
# Use Jina for intelligent data extraction and structuring
```

## License

This scraper is part of the sku-snap-style project. Use responsibly and in accordance with Nordstrom's Terms of Service.

## Contributing

When making changes:

1. Test with a small number of products first
2. Verify output format matches SKU database requirements
3. Update documentation if adding new features
4. Follow PEP 8 style guidelines

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in the console output
3. Verify website structure hasn't changed
4. Check Nordstrom's robots.txt for any restrictions

