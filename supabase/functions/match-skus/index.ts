import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Confidence threshold for matching (0.7 = 70%)
const MATCH_CONFIDENCE_THRESHOLD = 0.7;

// Helper function to calculate similarity score for candidate selection
function calculateSimilarityScore(item: any, sku: any): number {
  let score = 0;
  
  // Color matching (40% weight)
  if (item.color && sku.color) {
    const itemColor = item.color.toLowerCase();
    const skuColor = sku.color.toLowerCase();
    if (itemColor === skuColor) {
      score += 0.4;
    } else if (itemColor.includes(skuColor) || skuColor.includes(itemColor)) {
      score += 0.2;
    }
  }

  // Type matching (40% weight)
  if (item.type && sku.type) {
    const itemType = item.type.toLowerCase();
    const skuType = sku.type.toLowerCase();
    if (itemType === skuType) {
      score += 0.4;
    } else if (itemType.includes(skuType) || skuType.includes(itemType)) {
      score += 0.2;
    }
  }

  // Brand matching (20% weight) - if available
  if (item.brand && sku.brand) {
    const itemBrand = item.brand.toLowerCase();
    const skuBrand = sku.brand.toLowerCase();
    if (itemBrand === skuBrand) {
      score += 0.2;
    }
  }

  return score;
}

// AI function to find best match with confidence score
async function findBestMatchWithAI(
  item: any,
  candidateSkus: any[],
  apiKey: string
): Promise<{ sku: any; confidence: number } | null> {
  try {
    const candidateDescriptions = candidateSkus.map(sku => 
      `SKU: ${sku.sku_code}, Type: ${sku.type || 'N/A'}, Color: ${sku.color || 'N/A'}, Brand: ${sku.brand || 'N/A'}, Description: ${sku.description || 'N/A'}`
    ).join('\n');

    const prompt = `You are a clothing matching expert. Compare a clothing item with candidate SKUs and determine the best match.

Clothing Item:
- Type: ${item.type || 'Unknown'}
- Color: ${item.color || 'Unknown'}
- Image URL: ${item.image_url}

Candidate SKUs:
${candidateDescriptions}

Analyze the clothing item image and compare it with each candidate SKU. Determine which SKU (if any) matches the clothing item and provide a confidence score between 0 and 1 (where 1.0 = perfect match, 0.0 = no match).

Respond ONLY with valid JSON in this exact format:
{
  "matched_sku_code": "SKU_CODE_OR_NULL",
  "confidence": 0.85
}

If no SKU is a good match (confidence < ${MATCH_CONFIDENCE_THRESHOLD}), set matched_sku_code to null.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a clothing matching expert. Analyze images and match them to SKU descriptions. Provide confidence scores between 0 and 1.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: item.image_url
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI matching error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const result = JSON.parse(jsonStr.trim());

    if (result.matched_sku_code && result.confidence >= MATCH_CONFIDENCE_THRESHOLD) {
      const matchedSku = candidateSkus.find(sku => sku.sku_code === result.matched_sku_code);
      if (matchedSku) {
        return { sku: matchedSku, confidence: Math.min(1, Math.max(0, result.confidence)) };
      }
    }

    return null;
  } catch (error) {
    console.error('Error in AI matching:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting AI-powered SKU matching process...');

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

    // Match items with retailer SKUs using AI
    for (const item of items) {
      let bestMatch: { sku: any; confidence: number } | null = null;

      // First, try exact matching for quick matches
      const exactMatch = retailerSkus.find(sku => 
        sku.color?.toLowerCase() === item.color?.toLowerCase() &&
        sku.type?.toLowerCase() === item.type?.toLowerCase()
      );

      if (exactMatch) {
        // For exact matches, use high confidence (0.95)
        bestMatch = { sku: exactMatch, confidence: 0.95 };
      } else {
        // Use AI to find the best match with confidence score
        // Find top 5 candidates based on partial matching
        const candidates = retailerSkus
          .map(sku => ({
            sku,
            score: calculateSimilarityScore(item, sku)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(c => c.sku);

        if (candidates.length > 0) {
          const aiMatchResult = await findBestMatchWithAI(
            item,
            candidates,
            LOVABLE_API_KEY
          );
          if (aiMatchResult && aiMatchResult.confidence >= MATCH_CONFIDENCE_THRESHOLD) {
            bestMatch = aiMatchResult;
          }
        }
      }

      if (bestMatch) {
        // Update the item with the matched SKU and confidence score
        const { error: updateError } = await supabase
          .from('clothing_items')
          .update({ 
            matched_retailer_sku: bestMatch.sku.sku_code,
            confidence_score: bestMatch.confidence
          })
          .eq('id', item.id);

        if (updateError) {
          console.error('Error updating item:', updateError);
        } else {
          matchedCount++;
          console.log(`Matched item ${item.id} with SKU ${bestMatch.sku.sku_code} (confidence: ${(bestMatch.confidence * 100).toFixed(1)}%)`);
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