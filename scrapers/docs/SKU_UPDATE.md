# SKU Code Update - Item # as Primary SKU

## Summary

The scraper has been updated to use Nordstrom's **Item #** as the primary SKU code. The Item # is Nordstrom's official SKU number, so it is now stored in the `sku_code` field.

## Changes Made

### Before
- `sku_code`: Generated as `NORD-{product_id}` from URL
- `item_number`: Separate field containing Item #
- Two separate identifiers for the same product

### After
- `sku_code`: Contains Nordstrom's Item # (official SKU)
- `item_number`: Field removed (no longer needed)
- Single, official SKU identifier

## Updated Export Format

### JSON Example

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

### CSV Example

| sku_code | color | type | brand | description | url |
|----------|-------|------|-------|-------------|-----|
| 10249004 | red | dress | ASTR the Label | Maeve Midi Dress | ... |

## Migration Notes

If you have existing data with the old format:
- Old format: `sku_code: "NORD-7737947"`, `item_number: "10249004"`
- New format: `sku_code: "10249004"`

You'll need to update existing records to use the Item # as the SKU code.

## Benefits

1. **Official SKU**: Uses Nordstrom's actual SKU number
2. **Simplified Structure**: Single SKU field instead of two
3. **Better Matching**: Item # is the official identifier for matching
4. **Consistency**: Matches how Nordstrom identifies products

## Technical Details

- Removed `NORD-{product_id}` SKU generation
- Removed `item_number` field from exports
- Item # extraction remains the same (now stored as `sku_code`)
- All validation and normalization unchanged

