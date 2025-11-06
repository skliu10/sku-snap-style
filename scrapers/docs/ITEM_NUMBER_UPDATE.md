# SKU Code Update - Item # as SKU

## ✅ Implementation Complete

The scraper now uses Nordstrom's **Item #** as the SKU code. The Item # is Nordstrom's actual SKU number, so it has been set as the primary `sku_code` field.

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
    "sku_code": "10249004",
    "color": "red",
    "type": "dress",
    "brand": "ASTR the Label",
    "description": "Maeve Midi Dress"
  }
]
```

**Note**: The `sku_code` field now contains Nordstrom's Item # (the actual SKU number). The old format `NORD-{product_id}` has been removed.

### CSV Format

The CSV includes the `sku_code` column with Item # values:

| sku_code | color | type | brand | description | url |
|----------|-------|------|-------|-------------|-----|
| 10249004 | red | dress | ASTR the Label | Maeve Midi Dress | ... |

## Item # Extraction (Now Used as SKU)

The Item # is extracted and used as the SKU code using multiple methods:

1. **Text Pattern Matching**: Searches for "Item #", "Item Number:", or "Item ID:" followed by a 6+ digit number
2. **HTML Element Search**: Looks for elements containing Item # text
3. **Data Attributes**: Checks for `data-item-number` or `data-item-id` attributes
4. **CSS Selectors**: Attempts to find elements with item-number classes

The extracted Item # is stored in the `sku_code` field, replacing the previous `NORD-{product_id}` format.

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

- The `sku_code` field now contains Nordstrom's Item # (the actual SKU number)
- Item # may be empty (`""`) if not found on the page
- Item # is typically an 8-digit number (e.g., "10249004")
- The old `NORD-{product_id}` SKU format has been removed
- Item # is the official Nordstrom SKU identifier

