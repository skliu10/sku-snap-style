"""
Pytest configuration and shared fixtures for scraper tests.
"""

import sys
import os

# Add parent directory to path so we can import scraper modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

