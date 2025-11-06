# Makefile for Nordstrom Scraper

.PHONY: help install test clean lint format

help:
	@echo "Nordstrom Scraper - Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Clean temporary files"
	@echo "  make lint       - Run linter (if configured)"
	@echo "  make scrape     - Run example scrape (3 products)"

install:
	pip install -r requirements.txt

test:
	@echo "Running tests..."
	@python tests/test_with_mock.py
	@echo "\n✓ Pipeline tests complete"
	@echo "Run 'python tests/test_selenium.py' for live Selenium tests"

clean:
	rm -rf __pycache__/
	rm -rf tests/__pycache__/
	rm -rf scripts/__pycache__/
	rm -rf *.pyc
	rm -rf .pytest_cache/
	find . -type d -name __pycache__ -exec rm -r {} +
	find . -type f -name "*.pyc" -delete
	@echo "✓ Cleaned temporary files"

scrape:
	@echo "Running example scrape..."
	python main.py --category "https://www.nordstrom.com/browse/women/dresses" --use-selenium --max-products 3

