import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting SKU matching process...');

    // Get all clothing items without a match
    const { data: items, error: itemsError } = await supabase
      .from('clothing_items')
      .select('*')
      .is('matched_retailer_sku', null);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      throw itemsError;
    }

    // Get all retailer SKUs
    const { data: retailerSkus, error: skusError } = await supabase
      .from('retailer_skus')
      .select('*');

    if (skusError) {
      console.error('Error fetching retailer SKUs:', skusError);
      throw skusError;
    }

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No unmatched items to process', matched: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!retailerSkus || retailerSkus.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No retailer SKUs available for matching', matched: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let matchedCount = 0;

    // Match items with retailer SKUs
    for (const item of items) {
      // Simple matching logic: exact match on color and type
      const match = retailerSkus.find(sku => 
        sku.color?.toLowerCase() === item.color?.toLowerCase() &&
        sku.type?.toLowerCase() === item.type?.toLowerCase()
      );

      if (match) {
        // Update the item with the matched SKU
        const { error: updateError } = await supabase
          .from('clothing_items')
          .update({ 
            matched_retailer_sku: match.sku_code,
            // Preserve the original analysis confidence score
            confidence_score: item.confidence_score 
          })
          .eq('id', item.id);

        if (updateError) {
          console.error('Error updating item:', updateError);
        } else {
          matchedCount++;
          console.log(`Matched item ${item.id} with SKU ${match.sku_code}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully matched ${matchedCount} items`,
        matched: matchedCount,
        total: items.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-skus function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});