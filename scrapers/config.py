"""
Configuration file for web scraping operations.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Scraping configuration
REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
}

# Rate limiting configuration
RATE_LIMIT_DELAY_MIN = 1.0  # Minimum delay between requests (seconds)
RATE_LIMIT_DELAY_MAX = 3.0  # Maximum delay between requests (seconds)

# Retry configuration
MAX_RETRIES = 3
RETRY_BACKOFF_FACTOR = 2
RETRY_STATUS_CODES = [500, 502, 503, 504, 429]

# Timeout configuration
REQUEST_TIMEOUT = 30  # seconds
PAGE_LOAD_TIMEOUT = 30  # seconds

# Selenium configuration
SELENIUM_HEADLESS = True
SELENIUM_WAIT_TIME = 10  # seconds
SELENIUM_IMPLICIT_WAIT = 5  # seconds

# Nordstrom-specific configuration
NORDSTROM_BASE_URL = "https://www.nordstrom.com"
NORDSTROM_SEARCH_URL = "https://www.nordstrom.com/browse/search"
NORDSTROM_PRODUCT_PATTERN = r"/browse/[^/]+/[^/]+/(\d+)"

# Data extraction patterns
COLOR_KEYWORDS = [
    'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'navy', 'beige', 'tan', 'burgundy',
    'maroon', 'teal', 'turquoise', 'coral', 'salmon', 'ivory', 'cream',
    'khaki', 'olive', 'gold', 'silver', 'bronze', 'charcoal', 'slate'
]

CLOTHING_TYPES = [
    'dress', 'shirt', 'blouse', 't-shirt', 'tshirt', 'top', 'sweater',
    'jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'sweatshirt',
    'pants', 'jeans', 'trousers', 'leggings', 'shorts', 'skirt',
    'suit', 'vest', 'jumper', 'romper', 'jumpsuit'
]

# Output configuration
OUTPUT_DIR = "scraped_data"
OUTPUT_FORMAT = "json"  # json, csv, or both

# API Keys (set in .env file)
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
JINA_API_KEY = os.getenv("JINA_API_KEY", "")

