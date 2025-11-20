import { useState } from "react";
import { Upload, Link as LinkIcon, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SKUManagerProps {
  onSkusUploaded: () => void;
}

export const SKUManager = ({ onSkusUploaded }: SKUManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file",
        description: "Please upload a JSON file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const skus = JSON.parse(text);

      if (!Array.isArray(skus)) {
        throw new Error("JSON file must contain an array of SKUs");
      }

      // Insert SKUs into database
      const { error } = await supabase
        .from('retailer_skus')
        .insert(skus.map(sku => ({
          sku_code: sku.sku_code || sku.sku,
          color: sku.color,
          type: sku.type,
          brand: sku.brand,
          description: sku.description,
        })));

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Uploaded ${skus.length} retailer SKUs`,
      });

      onSkusUploaded();
    } catch (error) {
      console.error('Error uploading SKUs:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload SKUs",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleScrapeNordstrom = async () => {
    setIsScraping(true);

    try {
      toast({
        title: "Starting scrape...",
        description: "Scraping up to 50 Nordstrom products (this may take 2-3 minutes)",
      });

      // Call the scrape-nordstrom Edge Function
      console.log('Calling scrape-nordstrom function...');

      let scrapeData;
      let scrapeError;

      try {
        const result = await supabase.functions.invoke('scrape-nordstrom', {
          body: {
            category_url: 'https://www.nordstrom.com/browse/women/dresses',
            max_products: 50,
          },
          headers: {
            'Content-Type': 'application/json',
          }
        });

        scrapeData = result.data;
        scrapeError = result.error;
      } catch (invokeError) {
        console.error('Function invoke exception:', invokeError);
        if (invokeError instanceof TypeError && invokeError.message.includes('fetch')) {
          throw new Error('Network error: Unable to reach the scraping service. Please check your internet connection and ensure the edge function is deployed.');
        }
        throw invokeError;
      }

      if (scrapeError) {
        console.error('Edge function error:', scrapeError);
        if (scrapeError.message?.includes('Failed to send') ||
            scrapeError.message?.includes('fetch') ||
            scrapeError.message?.includes('NetworkError') ||
            scrapeError.message?.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to reach the scraping service. Please check your internet connection and ensure the edge function is deployed.');
        }
        throw new Error(scrapeError.message || 'Failed to scrape Nordstrom. Please ensure the edge function is deployed.');
      }

      if (!scrapeData) {
        throw new Error('No data returned from scraping service');
      }

      if (scrapeData.error) {
        toast({
          title: "Scraping limitation",
          description: scrapeData.error + (scrapeData.suggestion ? ` ${scrapeData.suggestion}` : ''),
          variant: "destructive",
        });
        return;
      }

      console.log('Scrape result:', scrapeData);

      toast({
        title: "Scraping complete!",
        description: `Scraped ${scrapeData.scraped || 0} products and matched ${scrapeData.matched || 0} items`,
      });

      onSkusUploaded();
    } catch (error) {
      console.error('Error scraping Nordstrom:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to scrape Nordstrom";
      if (error instanceof Error) {
        if (error.message.includes('edge function') || error.message.includes('Failed to send')) {
          errorMessage = "Failed to connect to scraping service. Please check if the edge function is deployed and try again.";
        } else if (error.message.includes('Network')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message || "The website may require JavaScript rendering.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const handleMatchSkus = async () => {
    setIsMatching(true);

    try {
      console.log('Calling match-skus function...');

      let matchData;
      let matchError;

      try {
        const result = await supabase.functions.invoke('match-skus', {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        matchData = result.data;
        matchError = result.error;
      } catch (invokeError) {
        console.error('Function invoke exception:', invokeError);
        // Handle network errors or other exceptions
        if (invokeError instanceof TypeError && invokeError.message.includes('fetch')) {
          throw new Error('Network error: Unable to reach the matching service. Please check your internet connection and ensure the edge function is deployed.');
        }
        throw invokeError;
      }

      if (matchError) {
        console.error('Edge function error:', matchError);
        // Check if it's a network/connection error
        if (matchError.message?.includes('Failed to send') ||
            matchError.message?.includes('fetch') ||
            matchError.message?.includes('NetworkError') ||
            matchError.message?.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to reach the matching service. Please check your internet connection and ensure the edge function is deployed.');
        }
        throw new Error(matchError.message || 'Failed to match SKUs. Please ensure the edge function is deployed.');
      }

      if (!matchData) {
        throw new Error('No data returned from matching service');
      }

      // Handle the case where the response has an error field
      if (matchData.error) {
        throw new Error(matchData.error);
      }

      console.log('Match result:', matchData);

      toast({
        title: "Matching complete!",
        description: `Matched ${matchData.matched || 0} out of ${matchData.total || 0} items`,
      });

      onSkusUploaded();
    } catch (error) {
      console.error('Error matching SKUs:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to match SKUs";
      if (error instanceof Error) {
        if (error.message.includes('edge function') || error.message.includes('Failed to send')) {
          errorMessage = "Failed to connect to matching service. Please check if the edge function is deployed and try again.";
        } else if (error.message.includes('Network')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>SKU Management</CardTitle>
        <CardDescription>
          Upload retailer SKU database and match with categorized items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          Choose an option to load retailer SKUs into the database
        </div>
        
        <div className="space-y-3">
          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="sku-upload"
            />
            <Button
              onClick={() => document.getElementById('sku-upload')?.click()}
              disabled={isUploading}
              variant="outline"
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Custom JSON
                </>
              )}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            onClick={handleScrapeNordstrom}
            disabled={isScraping || isUploading}
            variant="outline"
            className="w-full"
          >
            {isScraping ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping Nordstrom...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4" />
                Use Nordstrom SKU Scraper
              </>
            )}
          </Button>
        </div>

        <div className="pt-2">
          <Button
            onClick={handleMatchSkus}
            disabled={isMatching}
            className="w-full gradient-primary"
          >
            {isMatching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Matching...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Match Items to SKUs
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};