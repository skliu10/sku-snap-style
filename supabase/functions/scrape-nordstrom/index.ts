import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NordstromProduct {
  sku_code: string;
  color: string | null;
  type: string | null;
  brand: string;
  description: string;
}

// Color keywords for normalization
const COLOR_KEYWORDS = [
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'navy', 'beige', 'tan', 'burgundy',
  'maroon', 'teal', 'turquoise', 'coral', 'salmon', 'ivory', 'cream',
  'khaki', 'olive', 'gold', 'silver', 'bronze', 'charcoal', 'slate'
];

const CLOTHING_TYPES = [
  'dress', 'shirt', 'blouse', 't-shirt', 'tshirt', 'top', 'sweater',
  'jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'sweatshirt',
  'pants', 'jeans', 'trousers', 'leggings', 'shorts', 'skirt',
  'suit', 'vest', 'jumper', 'romper', 'jumpsuit'
];

function normalizeColor(colorText: string | null): string | null {
  if (!colorText) return null;
  const colorLower = colorText.toLowerCase().trim();
  for (const keyword of COLOR_KEYWORDS) {
    if (colorLower.includes(keyword)) {
      return keyword === 'grey' ? 'gray' : keyword;
    }
  }
  return colorLower;
}

function normalizeClothingType(typeText: string | null): string | null {
  if (!typeText) return null;
  const typeLower = typeText.toLowerCase().trim();
  for (const clothingType of CLOTHING_TYPES) {
    if (typeLower.includes(clothingType)) {
      const mapping: Record<string, string> = {
        't-shirt': 't-shirt',
        'tshirt': 't-shirt',
        't shirt': 't-shirt',
        'top': 'shirt',
        'trousers': 'pants',
      };
      return mapping[clothingType] || clothingType;
    }
  }
  return typeLower;
}

async function extractItemNumber(html: string): Promise<string | null> {
  // Pattern: Item # followed by 6+ digits
  const itemPatterns = [
    /Item\s*[#:]?\s*(\d{6,})/i,
    /Item\s*Number[:\s]+(\d{6,})/i,
    /Item\s*ID[:\s]+(\d{6,})/i,
  ];
  
  for (const pattern of itemPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function scrapeNordstromProduct(url: string): Promise<NordstromProduct | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.length === 0) {
      throw new Error("Received empty HTML response");
    }
    
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    if (!doc || !doc.documentElement) {
      throw new Error("Failed to parse HTML - document is null or invalid");
    }

    // Extract Item # (SKU)
    const itemNumber = await extractItemNumber(html);
    if (!itemNumber) {
      console.warn(`Could not extract Item # from ${url}`);
      return null;
    }

    // Extract title
    const titleElement = doc.querySelector('h1') || 
                        doc.querySelector('[data-testid="product-title"]') ||
                        doc.querySelector('.product-title');
    const title = titleElement?.textContent?.trim() || '';

    // Extract color
    let color: string | null = null;
    const bodyElement = doc.querySelector('body') || doc.documentElement;
    const pageText = bodyElement?.textContent?.toLowerCase() || '';
    for (const keyword of COLOR_KEYWORDS) {
      if (pageText.includes(keyword)) {
        color = keyword === 'grey' ? 'gray' : keyword;
        break;
      }
    }

    // Extract type from title or page
    let clothingType: string | null = null;
    const searchText = (title + ' ' + pageText).toLowerCase();
    for (const type of CLOTHING_TYPES) {
      if (searchText.includes(type)) {
        const mapping: Record<string, string> = {
          't-shirt': 't-shirt',
          'tshirt': 't-shirt',
          'top': 'shirt',
          'trousers': 'pants',
        };
        clothingType = mapping[type] || type;
        break;
      }
    }

    // Extract brand
    let brand = 'Nordstrom';
    const brandElement = doc.querySelector('[itemprop="brand"]') ||
                        doc.querySelector('.product-brand') ||
                        doc.querySelector('[data-testid="brand"]');
    if (brandElement) {
      brand = brandElement.textContent?.trim() || 'Nordstrom';
    }

    return {
      sku_code: itemNumber,
      color: normalizeColor(color),
      type: normalizeClothingType(clothingType),
      brand: brand.trim(),
      description: title || 'Nordstrom Product',
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function scrapeNordstromCategory(categoryUrl: string, maxProducts: number = 50): Promise<NordstromProduct[]> {
  try {
    // For now, we'll scrape a few sample products
    // In production, you'd want to parse the category page to get product URLs
    // This is a simplified version - you may want to use Puppeteer or similar for JS-rendered content
    
    const response = await fetch(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.length === 0) {
      throw new Error("Received empty HTML response");
    }
    
    const doc = new DOMParser().parseFromString(html, "text/html");
    
    if (!doc || !doc.documentElement) {
      throw new Error("Failed to parse HTML - document is null or invalid");
    }

    // Find product URLs - Nordstrom uses /s/{slug}/{id} pattern
    const productUrls: string[] = [];
    const links = doc.querySelectorAll('a[href]');
    const seenUrls = new Set<string>();
    
    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (href && /\/s\/[^/]+\/\d+/.test(href)) {
        // Clean URL - remove query parameters and fragments for deduplication
        const cleanHref = href.split('?')[0].split('#')[0];
        const fullUrl = cleanHref.startsWith('http') ? cleanHref : `https://www.nordstrom.com${cleanHref}`;
        
        // Check if we've seen this product ID before (same product, different color/size)
        const productIdMatch = fullUrl.match(/\/s\/[^/]+\/(\d+)/);
        if (productIdMatch) {
          const productId = productIdMatch[1];
          if (!seenUrls.has(productId) && !fullUrl.includes('customer-service')) {
            seenUrls.add(productId);
            productUrls.push(fullUrl);
            if (productUrls.length >= maxProducts) break;
          }
        }
      }
    }
    
    // If we need more products, try to load additional pages
    // Note: This is a simplified approach. For full pagination, you'd need to handle JavaScript rendering
    if (productUrls.length < maxProducts) {
      console.log(`Found ${productUrls.length} products on first page. Note: More products may require JavaScript rendering.`);
    }

    console.log(`Found ${productUrls.length} product URLs, attempting to scrape up to ${maxProducts} products`);

    // Scrape each product
    const products: NordstromProduct[] = [];
    const maxAttempts = Math.min(productUrls.length, maxProducts);
    
    for (let i = 0; i < maxAttempts && products.length < maxProducts; i++) {
      const url = productUrls[i];
      
      // Add delay to respect rate limits (1.5 seconds between requests)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      try {
        const product = await scrapeNordstromProduct(url);
        if (product) {
          // Check for duplicates by SKU
          const isDuplicate = products.some(p => p.sku_code === product.sku_code);
          if (!isDuplicate) {
            products.push(product);
            console.log(`Scraped ${products.length}/${maxProducts}: ${product.sku_code} - ${product.description}`);
          } else {
            console.log(`Skipped duplicate SKU: ${product.sku_code}`);
          }
        }
      } catch (error) {
        console.error(`Error scraping product ${i + 1}/${maxAttempts}:`, error);
        // Continue with next product even if one fails
      }
      
      // Stop if we've reached the max products
      if (products.length >= maxProducts) {
        console.log(`Reached max products limit: ${maxProducts}`);
        break;
      }
    }
    
    console.log(`Successfully scraped ${products.length} unique products`);

    return products;
  } catch (error) {
    console.error(`Error scraping category ${categoryUrl}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body safely
    let requestBody: { category_url?: string; max_products?: number } = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
      }
    } catch (parseError) {
      console.warn('Failed to parse request body, using defaults:', parseError);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use provided category_url or default
    const urlToScrape = requestBody.category_url || 'https://www.nordstrom.com/browse/women/dresses';
    const max_products = requestBody.max_products || 50;
    
    console.log(`Scraping Nordstrom category: ${urlToScrape}, max products: ${max_products}`);
    
    // Scrape products
    const products = await scrapeNordstromCategory(urlToScrape, max_products);

    if (products.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No products found. The website may require JavaScript rendering.',
          suggestion: 'Consider using the Python scraper with Selenium for better results.',
          scraped: 0,
          matched: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully scraped ${products.length} products, inserting into database...`);

    // Insert SKUs into database (handle duplicates gracefully)
    const skusToInsert = products.map(product => ({
      sku_code: product.sku_code,
      color: product.color,
      type: product.type,
      brand: product.brand,
      description: product.description,
    }));

    // Try upsert first, fallback to insert if upsert not supported
    const { error: insertError } = await supabase
      .from('retailer_skus')
      .insert(skusToInsert);

    if (insertError) {
      console.error('Error inserting SKUs:', insertError);
      // If it's a duplicate error, that's okay - some may have been inserted
      if (!insertError.message?.includes('duplicate') && !insertError.code?.includes('23505')) {
        // Only throw if it's not a duplicate key error
        console.warn('Some SKUs may not have been inserted due to duplicates, continuing...');
      }
    }

    console.log('Triggering automatic matching...');

    // Automatically trigger matching
    const { data: items, error: itemsError } = await supabase
      .from('clothing_items')
      .select('*')
      .is('matched_retailer_sku', null);

    if (itemsError) {
      console.error('Error fetching items for matching:', itemsError);
    }

    const { data: retailerSkus, error: skusError } = await supabase
      .from('retailer_skus')
      .select('*');

    if (skusError) {
      console.error('Error fetching retailer SKUs for matching:', skusError);
    }

    let matchedCount = 0;
    if (items && retailerSkus) {
      for (const item of items) {
        const match = retailerSkus.find(sku => 
          sku.color?.toLowerCase() === item.color?.toLowerCase() &&
          sku.type?.toLowerCase() === item.type?.toLowerCase()
        );

        if (match) {
          const { error: updateError } = await supabase
            .from('clothing_items')
            .update({ 
              matched_retailer_sku: match.sku_code,
              confidence_score: item.confidence_score 
            })
            .eq('id', item.id);

          if (!updateError) {
            matchedCount++;
          } else {
            console.error(`Error updating item ${item.id}:`, updateError);
          }
        }
      }
    }

    console.log(`Matching complete: ${matchedCount} items matched`);

    return new Response(
      JSON.stringify({ 
        message: `Successfully scraped ${products.length} products and matched ${matchedCount} items`,
        scraped: products.length,
        matched: matchedCount,
        products: products.slice(0, 10) // Return first 10 to avoid large response
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-nordstrom function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack ? 'Check server logs for details' : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

