# Integrating Scraped Data with SKU Manager

This guide explains how to integrate the scraped Nordstrom product data with your existing SKU Manager component.

## Workflow

1. **Scrape Products**: Use the Python scraper to extract product data from Nordstrom
2. **Export Data**: Scraper exports JSON in the correct format
3. **Import to App**: Use the SKU Manager's "Upload Custom JSON" feature

## Step-by-Step Integration

### 1. Scrape Nordstrom Products

```bash
cd scrapers
python main.py --search "dress" --max-results 50
```

This creates a file like: `scraped_data/nordstrom_skus_20250109_143022.json`

### 2. Format Verification

The exported JSON format matches your SKU database schema:

```json
[
  {
    "sku_code": "NORD-1234567",
    "color": "black",
    "type": "dress",
    "brand": "Nordstrom",
    "description": "Black cocktail dress with v-neck"
  }
]
```

### 3. Upload to Your App

**Option A: Via UI**
1. Open your app
2. Go to the SKU Management section
3. Click "Upload Custom JSON"
4. Select the exported JSON file from `scraped_data/`

**Option B: Replace Sample Data**
1. Copy the exported JSON file
2. Replace `/public/sample-skus.json` with the new file
3. Use the "Use Sample SKUs" button

**Option C: Direct Database Import**
If you have database access, you can import directly using the Supabase client.

## Automated Integration (Future)

You could create a Supabase Edge Function to automatically:
1. Trigger scraping on a schedule
2. Process and validate scraped data
3. Import into the `retailer_skus` table

Example Edge Function structure:
```
supabase/functions/scrape-nordstrom/index.ts
```

## Data Matching

The scraped data will work with your existing matching logic in `match-skus` function:

- Colors are normalized (e.g., "BLK" → "black")
- Types are normalized (e.g., "T-Shirt" → "t-shirt")
- SKU codes follow the format: `NORD-{product_id}`

## Tips

1. **Incremental Updates**: Scrape in batches and merge JSON files before importing
2. **Data Validation**: Review scraped data before importing to ensure quality
3. **Rate Limiting**: Be respectful of Nordstrom's servers when scraping
4. **Error Handling**: Check logs for any failed extractions

## Troubleshooting

**Issue**: Uploaded JSON not matching expected format
- Verify the JSON structure matches the sample format
- Check that all required fields (sku_code, type) are present
- Ensure JSON is valid (no syntax errors)

**Issue**: Products not matching after import
- Verify color and type normalization is working
- Check that scraped colors/types match your clothing items
- Review the matching logic in `match-skus` function

