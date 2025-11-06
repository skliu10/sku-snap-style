# Changelog

All notable changes to the Nordstrom scraper will be documented in this file.

## [1.0.0] - 2025-11-06

### Added
- Initial release of Nordstrom web scraper
- Selenium support for JavaScript-rendered content
- Product data extraction (SKU, color, type, brand, description)
- JSON and CSV export formats
- Rate limiting and error handling
- Data normalization and validation
- Comprehensive test suite
- Documentation and examples

### Features
- Multiple scraping methods (search, category, direct URLs)
- Item # extraction and use as SKU code (Nordstrom's official SKU)
- Data normalization for colors and clothing types
- Robust retry logic with exponential backoff
- Configurable rate limiting

### Changed
- **SKU Code Format**: Now uses Nordstrom's Item # as the `sku_code` field
  - Removed `NORD-{product_id}` format
  - Removed separate `item_number` field
  - Item # is Nordstrom's official SKU number

## Project Structure

The scraper follows best practices with organized directories:
- `tests/` - Test files and debug scripts
- `docs/` - Documentation
- `scripts/` - Example scripts
- Core modules in root directory

