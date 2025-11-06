# Project Structure

This document describes the organization of the Nordstrom scraper project following best practices.

## Directory Structure

```
scrapers/
├── main.py                    # Main CLI entry point
├── nordstrom_scraper.py       # Core scraping logic
├── data_exporter.py           # Data export functionality
├── utils.py                   # Utility functions
├── selenium_utils.py          # Selenium helpers
├── config.py                  # Configuration settings
├── requirements.txt           # Python dependencies
├── setup.py                   # Package setup file
├── Makefile                   # Build and test commands
├── README.md                  # Main documentation
├── CHANGELOG.md              # Version history
├── STRUCTURE.md              # This file
│
├── tests/                     # Test suite
│   ├── __init__.py
│   ├── conftest.py           # Pytest configuration
│   ├── README.md             # Test documentation
│   ├── test_scraper.py       # Basic scraper tests
│   ├── test_selenium.py      # Selenium integration tests
│   ├── test_direct_product.py # Direct URL tests
│   ├── test_with_mock.py     # Mock data tests
│   ├── test_item_number.py   # Item # extraction tests
│   ├── debug_page.py         # Page structure debugging
│   └── debug_selenium.py     # Selenium debugging
│
├── docs/                      # Documentation
│   ├── README.md             # Documentation index
│   ├── QUICKSTART.md         # Quick start guide
│   ├── INTEGRATION.md        # Integration guide
│   ├── TEST_RESULTS.md       # Test results
│   ├── SELENIUM_TEST_SUCCESS.md # Selenium test results
│   └── ITEM_NUMBER_UPDATE.md # Item # feature docs
│
├── scripts/                   # Example scripts
│   ├── __init__.py
│   └── example.py            # Usage examples
│
└── scraped_data/             # Output directory (gitignored)
    └── *.json, *.csv         # Exported data files
```

## File Organization Principles

### Core Modules (Root)
- **Main application code** in root directory
- **Single responsibility** per module
- **Clear naming** that indicates purpose

### Tests Directory
- All test files organized in `tests/`
- Debug scripts also in `tests/` (excluded from git where appropriate)
- `conftest.py` for shared pytest configuration

### Documentation
- Main README in root
- Additional docs in `docs/` directory
- Clear separation of concerns

### Scripts
- Example and utility scripts in `scripts/`
- Not part of core functionality
- Demonstrates usage patterns

### Configuration
- `config.py` for all configuration
- `.gitignore` properly configured
- `requirements.txt` for dependencies
- `setup.py` for package installation

## Best Practices Followed

1. ✅ **Separation of Concerns**: Core code, tests, docs, and scripts separated
2. ✅ **Test Organization**: All tests in dedicated directory
3. ✅ **Documentation**: Well-organized docs directory
4. ✅ **Git Ignore**: Proper exclusions for temporary files
5. ✅ **Import Structure**: Proper module imports with path handling
6. ✅ **Package Structure**: `__init__.py` files for proper packages
7. ✅ **Build Tools**: Makefile and setup.py for common tasks
8. ✅ **Version Control**: CHANGELOG.md for tracking changes

## Usage

### Running Tests
```bash
# From scrapers directory
python tests/test_with_mock.py
python tests/test_selenium.py
```

### Running Scripts
```bash
# From scrapers directory
python scripts/example.py
```

### Using Makefile
```bash
make install    # Install dependencies
make test       # Run tests
make clean      # Clean temporary files
make scrape     # Run example scrape
```

## Maintenance

- Keep tests updated when adding features
- Update CHANGELOG.md for significant changes
- Maintain documentation in `docs/` directory
- Clean up debug files regularly (gitignored)

