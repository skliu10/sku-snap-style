# Nordstrom Scraper Documentation

## Quick Links

- **[Quick Start Guide](QUICKSTART.md)** - Get started in 5 minutes
- **[Integration Guide](INTEGRATION.md)** - Integrate with your SKU Manager app
- **[Test Results](TEST_RESULTS.md)** - Pipeline test results
- **[Selenium Test Results](SELENIUM_TEST_SUCCESS.md)** - Live scraping test results
- **[Item Number Update](ITEM_NUMBER_UPDATE.md)** - Item # extraction documentation

## Overview

The Nordstrom scraper extracts product information including:
- SKU codes
- Item numbers
- Colors
- Clothing types
- Brands
- Descriptions

## Features

- ✅ Selenium support for JavaScript-rendered content
- ✅ Multiple scraping methods (search, category, direct URLs)
- ✅ Data normalization and validation
- ✅ JSON and CSV export formats
- ✅ Rate limiting and error handling

## Getting Started

1. Install dependencies: `pip install -r requirements.txt`
2. Run a test scrape: `python main.py --search "dress" --use-selenium --max-results 3`
3. Import exported JSON into your SKU Manager

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

