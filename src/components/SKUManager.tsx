import { useState } from "react";
import { Upload, Link as LinkIcon, Loader2 } from "lucide-react";
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

  const handleLoadSampleSkus = async () => {
    setIsUploading(true);

    try {
      const response = await fetch('/sample-skus.json');
      const skus = await response.json();

      if (!Array.isArray(skus)) {
        throw new Error("Sample data must contain an array of SKUs");
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
        description: `Loaded ${skus.length} sample retailer SKUs`,
      });

      onSkusUploaded();
    } catch (error) {
      console.error('Error loading sample SKUs:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load sample SKUs",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMatchSkus = async () => {
    setIsMatching(true);

    try {
      const { data, error } = await supabase.functions.invoke('match-skus');

      if (error) throw error;

      toast({
        title: "Matching complete!",
        description: `Matched ${data.matched} out of ${data.total} items`,
      });

      onSkusUploaded();
    } catch (error) {
      console.error('Error matching SKUs:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to match SKUs",
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
            onClick={handleLoadSampleSkus}
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
                Use Sample SKUs (55 items)
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