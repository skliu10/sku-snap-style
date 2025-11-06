# Scraper Tests

This directory contains test files for the Nordstrom scraper.

## Test Files

- `test_scraper.py` - Basic scraper functionality tests
- `test_selenium.py` - Selenium-based live scraping tests
- `test_direct_product.py` - Direct product URL scraping tests
- `test_with_mock.py` - Mock data pipeline tests
- `test_item_number.py` - Item # extraction tests
- `debug_*.py` - Debug scripts for troubleshooting

## Running Tests

```bash
# Run all tests
python -m pytest tests/

# Run specific test
python tests/test_scraper.py

# Run with Selenium (requires Chrome)
python tests/test_selenium.py
```

## Debug Files

Debug HTML files and scripts are stored here but excluded from git (see `.gitignore`).

