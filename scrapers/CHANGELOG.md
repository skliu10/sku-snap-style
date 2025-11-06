# Changelog

All notable changes to the Nordstrom scraper will be documented in this file.

## [1.0.0] - 2025-11-06

### Added
- Initial release of Nordstrom web scraper
- Selenium support for JavaScript-rendered content
- Product data extraction (SKU, Item #, color, type, brand, description)
- JSON and CSV export formats
- Rate limiting and error handling
- Data normalization and validation
- Comprehensive test suite
- Documentation and examples

### Features
- Multiple scraping methods (search, category, direct URLs)
- Item # extraction from Nordstrom product pages
- Data normalization for colors and clothing types
- Robust retry logic with exponential backoff
- Configurable rate limiting

## Project Structure

The scraper follows best practices with organized directories:
- `tests/` - Test files and debug scripts
- `docs/` - Documentation
- `scripts/` - Example scripts
- Core modules in root directory

