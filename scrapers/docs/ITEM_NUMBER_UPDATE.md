# Item Number Extraction - Update Summary

## ✅ Implementation Complete

The scraper now extracts Nordstrom's **Item #** and includes it in all JSON and CSV exports.

## Changes Made

### 1. Scraper Updates (`nordstrom_scraper.py`)

- Added `item_number` field to product data structure
- Implemented `_extract_item_number()` method with multiple extraction strategies:
  - Pattern matching for "Item #" text in page content
  - HTML element search for Item # text
  - Data attribute checking
  - Selector-based extraction

### 2. Exporter Updates (`data_exporter.py`)

- Added `item_number` field to JSON exports
- Added `item_number` column to CSV exports
- Item # is included even if empty (empty string `""`)

## Export Format

### JSON Format

```json
[
  {
    "sku_code": "NORD-7737947",
    "item_number": "10249004",
    "color": "red",
    "type": "dress",
    "brand": "ASTR the Label",
    "description": "Maeve Midi Dress"
  }
]
```

### CSV Format

The CSV now includes an `item_number` column:

| sku_code | item_number | color | type | brand | description | url |
|----------|-------------|-------|------|-------|-------------|-----|
| NORD-7737947 | 10249004 | red | dress | ASTR the Label | Maeve Midi Dress | ... |

## Item # Extraction

The Item # is extracted using multiple methods:

1. **Text Pattern Matching**: Searches for "Item #", "Item Number:", or "Item ID:" followed by a 6+ digit number
2. **HTML Element Search**: Looks for elements containing Item # text
3. **Data Attributes**: Checks for `data-item-number` or `data-item-id` attributes
4. **CSS Selectors**: Attempts to find elements with item-number classes

## Testing

✅ Tested and verified on multiple Nordstrom product pages
✅ Item # successfully extracted and included in exports
✅ Works with both JSON and CSV export formats

## Usage

No changes needed to usage - Item # is automatically included:

```bash
python main.py --category "https://www.nordstrom.com/browse/women/dresses" --use-selenium --max-products 10
```

The exported JSON/CSV files will now include the `item_number` field.

## Notes

- Item # may be empty (`""`) if not found on the page
- Item # is typically an 8-digit number (e.g., "10249004")
- Item # is different from the product ID in the URL (which becomes `sku_code`)

