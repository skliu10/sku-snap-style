import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraUpload } from "@/components/CameraUpload";
import { ClothingItem } from "@/components/ClothingItem";
import { SKUManager } from "@/components/SKUManager";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

interface ClothingItemData {
  id: string;
  image_url: string;
  generated_sku: string;
  color: string | null;
  type: string | null;
  condition: string | null;
  matched_retailer_sku: string | null;
  confidence_score: number | null;
}

const Index = () => {
  const [items, setItems] = useState<ClothingItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const matchedItems = items.filter(item => item.matched_retailer_sku);
  const unmatchedItems = items.filter(item => !item.matched_retailer_sku);

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center py-20 mb-12"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
        <div className="relative container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl font-bold mb-4">
            Clothing Recognition & SKU Manager
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            AI-powered clothing categorization with automatic SKU generation and retailer matching
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <CameraUpload onAnalysisComplete={fetchItems} />
          </div>
          <div>
            <SKUManager onSkusUploaded={fetchItems} />
          </div>
        </div>

        {/* Items Display */}
        <div className="bg-card rounded-2xl shadow-card p-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all">
                All Items ({items.length})
              </TabsTrigger>
              <TabsTrigger value="matched">
                Matched ({matchedItems.length})
              </TabsTrigger>
              <TabsTrigger value="unmatched">
                Unmatched ({unmatchedItems.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No items yet. Upload a photo to get started!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item) => (
                    <ClothingItem
                      key={item.id}
                      imageUrl={item.image_url}
                      sku={item.generated_sku}
                      color={item.color || undefined}
                      type={item.type || undefined}
                      condition={item.condition || undefined}
                      matchedSku={item.matched_retailer_sku || undefined}
                      confidence={item.confidence_score || undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="matched">
              {matchedItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No matched items yet. Upload retailer SKUs and run matching!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {matchedItems.map((item) => (
                    <ClothingItem
                      key={item.id}
                      imageUrl={item.image_url}
                      sku={item.generated_sku}
                      color={item.color || undefined}
                      type={item.type || undefined}
                      condition={item.condition || undefined}
                      matchedSku={item.matched_retailer_sku || undefined}
                      confidence={item.confidence_score || undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="unmatched">
              {unmatchedItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  All items have been matched!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {unmatchedItems.map((item) => (
                    <ClothingItem
                      key={item.id}
                      imageUrl={item.image_url}
                      sku={item.generated_sku}
                      color={item.color || undefined}
                      type={item.type || undefined}
                      condition={item.condition || undefined}
                      matchedSku={item.matched_retailer_sku || undefined}
                      confidence={item.confidence_score || undefined}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;