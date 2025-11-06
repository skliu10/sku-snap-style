# Quick Start Guide

Get started with the Nordstrom scraper in 5 minutes!

## Step 1: Install Dependencies

```bash
cd scrapers
pip install -r requirements.txt
```

## Step 2: Test the Scraper

Try scraping a few products with a search query:

```bash
python main.py --search "black dress" --max-results 5
```

This will:
1. Search Nordstrom for "black dress"
2. Extract product information from the first 5 results
3. Export data to `scraped_data/nordstrom_skus_[timestamp].json`

## Step 3: Import into Your App

The exported JSON file matches the format expected by your SKU Manager:

```json
[
  {
    "sku_code": "NORD-1234567",
    "color": "black",
    "type": "dress",
    "brand": "Nordstrom",
    "description": "Black cocktail dress"
  }
]
```

You can:
1. Use the "Upload Custom JSON" button in the SKU Manager
2. Or replace `/public/sample-skus.json` with your scraped data

## Common Use Cases

### Scrape a Specific Category

```bash
python main.py --category "https://www.nordstrom.com/browse/women/dresses" --max-products 20
```

### Scrape Specific Product URLs

```bash
python main.py --urls "https://www.nordstrom.com/browse/women/clothing/dress/..." "https://www.nordstrom.com/..."
```

### Use Selenium for JavaScript-Heavy Pages

```bash
python main.py --search "jeans" --use-selenium --max-results 10
```

## Troubleshooting

**Issue**: "No products found"
- Try using `--use-selenium` flag
- Check if the URL/search query is correct
- Verify you have internet connection

**Issue**: "Selenium errors"
- Make sure Chrome browser is installed
- ChromeDriver will be auto-downloaded, but ensure you have internet

**Issue**: "Rate limited"
- Increase delays in `config.py`
- Reduce `--max-results` value
- Wait a few minutes before trying again

## Next Steps

- Read the full [README.md](README.md) for advanced usage
- Check [example.py](example.py) for programmatic usage
- Customize `config.py` for your needs

