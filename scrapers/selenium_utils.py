"""
Selenium utilities for handling JavaScript-rendered content.
"""

import logging
import time
from typing import Optional
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager

from config import (
    SELENIUM_HEADLESS,
    SELENIUM_WAIT_TIME,
    SELENIUM_IMPLICIT_WAIT,
    REQUEST_HEADERS
)

logger = logging.getLogger(__name__)


def create_driver(headless: bool = SELENIUM_HEADLESS) -> Optional[webdriver.Chrome]:
    """
    Create and configure a Chrome WebDriver instance.
    
    Args:
        headless: Whether to run browser in headless mode
        
    Returns:
        Configured Chrome WebDriver or None if failed
    """
    try:
        chrome_options = Options()
        
        if headless:
            chrome_options.add_argument('--headless=new')  # Use new headless mode
        
        # Additional options for better compatibility
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument(f'user-agent={REQUEST_HEADERS["User-Agent"]}')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-gpu')  # Helpful for headless mode
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Disable images for faster loading (optional - can be enabled for better data)
        # prefs = {
        #     'profile.managed_default_content_settings.images': 2,
        # }
        # chrome_options.add_experimental_option('prefs', prefs)
        
        # For macOS, Chrome is typically in Applications
        import platform
        if platform.system() == 'Darwin':  # macOS
            chrome_options.binary_location = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.implicitly_wait(SELENIUM_IMPLICIT_WAIT)
        
        # Execute script to hide webdriver property
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            '''
        })
        
        return driver
        
    except Exception as e:
        logger.error(f"Error creating Chrome driver: {str(e)}")
        return None


def get_page_with_selenium(url: str, wait_for_selector: Optional[str] = None) -> Optional[str]:
    """
    Fetch a webpage using Selenium for JavaScript-rendered content.
    
    Args:
        url: URL to fetch
        wait_for_selector: Optional CSS selector to wait for before extracting HTML
        
    Returns:
        HTML content as string or None if failed
    """
    driver = None
    try:
        driver = create_driver()
        if not driver:
            return None
        
        logger.info(f"Fetching {url} with Selenium...")
        driver.get(url)
        
        # Wait for specific element if provided
        if wait_for_selector:
            try:
                WebDriverWait(driver, SELENIUM_WAIT_TIME).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, wait_for_selector))
                )
            except TimeoutException:
                logger.warning(f"Timeout waiting for selector: {wait_for_selector}")
        
        # Additional wait for dynamic content to load
        time.sleep(3)
        
        # Scroll to bottom to trigger lazy loading
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
        # Scroll back up
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        html = driver.page_source
        return html
        
    except WebDriverException as e:
        logger.error(f"Selenium error fetching {url}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error with Selenium: {str(e)}")
        return None
    finally:
        if driver:
            driver.quit()


def wait_for_element(driver: webdriver.Chrome, selector: str, timeout: int = SELENIUM_WAIT_TIME) -> bool:
    """
    Wait for an element to be present on the page.
    
    Args:
        driver: WebDriver instance
        selector: CSS selector
        timeout: Maximum time to wait (seconds)
        
    Returns:
        True if element found, False otherwise
    """
    try:
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
        )
        return True
    except TimeoutException:
        return False

