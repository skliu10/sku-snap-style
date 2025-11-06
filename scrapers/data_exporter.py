"""
Data export utilities for scraped product data.
"""

import json
import csv
import os
from typing import List, Dict, Any
from datetime import datetime
import logging

from config import OUTPUT_DIR, OUTPUT_FORMAT

logger = logging.getLogger(__name__)


class DataExporter:
    """Export scraped data to various formats."""
    
    def __init__(self, output_dir: str = OUTPUT_DIR):
        """
        Initialize the data exporter.
        
        Args:
            output_dir: Directory to save exported files
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def export_json(self, products: List[Dict[str, Any]], filename: str = None) -> str:
        """
        Export products to JSON file compatible with SKU format.
        
        Args:
            products: List of product dictionaries
            filename: Output filename (optional)
            
        Returns:
            Path to exported file
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nordstrom_skus_{timestamp}.json"
        
        filepath = os.path.join(self.output_dir, filename)
        
        # Format products to match SKU format
        formatted_products = []
        for product in products:
            formatted_product = {
                'sku_code': product.get('sku_code', ''),  # Item # (Nordstrom's SKU)
                'color': product.get('color', ''),
                'type': product.get('type', ''),
                'brand': product.get('brand', 'Nordstrom'),
                'description': product.get('description', '')
            }
            formatted_products.append(formatted_product)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(formatted_products, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Exported {len(formatted_products)} products to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error exporting JSON: {str(e)}")
            raise
    
    def export_csv(self, products: List[Dict[str, Any]], filename: str = None) -> str:
        """
        Export products to CSV file.
        
        Args:
            products: List of product dictionaries
            filename: Output filename (optional)
            
        Returns:
            Path to exported file
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nordstrom_skus_{timestamp}.csv"
        
        filepath = os.path.join(self.output_dir, filename)
        
        if not products:
            logger.warning("No products to export")
            return filepath
        
        fieldnames = ['sku_code', 'color', 'type', 'brand', 'description', 'url']
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for product in products:
                    row = {
                        'sku_code': product.get('sku_code', ''),
                        'color': product.get('color', ''),
                        'type': product.get('type', ''),
                        'brand': product.get('brand', 'Nordstrom'),
                        'description': product.get('description', ''),
                        'url': product.get('url', '')
                    }
                    writer.writerow(row)
            
            logger.info(f"Exported {len(products)} products to {filepath}")
            return filepath
            
        except Exception as e:
            logger.error(f"Error exporting CSV: {str(e)}")
            raise
    
    def export(self, products: List[Dict[str, Any]], format: str = None) -> List[str]:
        """
        Export products in the specified format(s).
        
        Args:
            products: List of product dictionaries
            format: Export format ('json', 'csv', or 'both')
            
        Returns:
            List of exported file paths
        """
        if not format:
            format = OUTPUT_FORMAT
        
        exported_files = []
        
        if format in ['json', 'both']:
            try:
                filepath = self.export_json(products)
                exported_files.append(filepath)
            except Exception as e:
                logger.error(f"Failed to export JSON: {str(e)}")
        
        if format in ['csv', 'both']:
            try:
                filepath = self.export_csv(products)
                exported_files.append(filepath)
            except Exception as e:
                logger.error(f"Failed to export CSV: {str(e)}")
        
        return exported_files

