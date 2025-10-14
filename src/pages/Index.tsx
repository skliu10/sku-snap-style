import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraUpload } from "@/components/CameraUpload";
import { ClothingItem } from "@/components/ClothingItem";
import { SKUManager } from "@/components/SKUManager";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [skuSearchQuery, setSkuSearchQuery] = useState("");

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

  // Group items by generated SKU
  const itemsBySku = items.reduce((acc, item) => {
    if (!acc[item.generated_sku]) {
      acc[item.generated_sku] = [];
    }
    acc[item.generated_sku].push(item);
    return acc;
  }, {} as Record<string, ClothingItemData[]>);

  // Filter SKUs based on search query
  const filteredSkus = Object.entries(itemsBySku).filter(([sku, skuItems]) => {
    const searchLower = skuSearchQuery.toLowerCase();
    return (
      sku.toLowerCase().includes(searchLower) ||
      skuItems.some(item => 
        item.color?.toLowerCase().includes(searchLower) ||
        item.type?.toLowerCase().includes(searchLower) ||
        item.matched_retailer_sku?.toLowerCase().includes(searchLower)
      )
    );
  });

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
        {/* Information Section */}
        <div className="bg-card rounded-2xl shadow-card p-8 mb-8 border border-border">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Understanding Your Results</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Item Tags
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong className="text-foreground">Type:</strong> The category of clothing (e.g., Jeans, T-Shirt, Jacket)</p>
                <p><strong className="text-foreground">Color:</strong> The primary color detected in the item</p>
                <p><strong className="text-foreground">Condition:</strong> Assessment of the item's state (New, Good, Fair, Poor)</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Confidence Score
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong className="text-foreground">90-100%:</strong> Excellent match - highly confident</p>
                <p><strong className="text-foreground">70-89%:</strong> Good match - reliable</p>
                <p><strong className="text-foreground">50-69%:</strong> Fair match - review recommended</p>
                <p><strong className="text-foreground">Below 50%:</strong> Low confidence - manual review needed</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                SKU System
              </h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong className="text-foreground">Generated SKU:</strong> Automatically created code based on item attributes (format: COLOR-TYPE)</p>
                <p><strong className="text-foreground">Matched SKU:</strong> When found, shows the corresponding retailer SKU from your database</p>
                <p><strong className="text-foreground">Grouping:</strong> Items with identical attributes receive the same SKU for easy inventory management</p>
              </div>
            </div>
          </div>
        </div>
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
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="all">
                All Items ({items.length})
              </TabsTrigger>
              <TabsTrigger value="matched">
                Matched ({matchedItems.length})
              </TabsTrigger>
              <TabsTrigger value="unmatched">
                Unmatched ({unmatchedItems.length})
              </TabsTrigger>
              <TabsTrigger value="by-sku">
                By SKU ({Object.keys(itemsBySku).length})
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

            <TabsContent value="by-sku">
              {Object.keys(itemsBySku).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No items yet. Upload a photo to get started!
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search by SKU, color, type, or matched SKU..."
                      value={skuSearchQuery}
                      onChange={(e) => setSkuSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Results Count */}
                  <div className="text-sm text-muted-foreground">
                    {skuSearchQuery && (
                      <span>
                        Found {filteredSkus.length} SKU{filteredSkus.length !== 1 ? 's' : ''} matching "{skuSearchQuery}"
                      </span>
                    )}
                  </div>

                  {/* SKU Groups */}
                  {filteredSkus.length === 0 && skuSearchQuery ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No SKUs found matching your search.
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {filteredSkus
                        .sort(([, a], [, b]) => b.length - a.length)
                        .map(([sku, skuItems]) => (
                      <div key={sku} className="border border-border rounded-lg p-6 bg-background/50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-foreground">
                            {sku}
                          </h3>
                          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {skuItems.length} {skuItems.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {skuItems.map((item) => (
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
                        </div>
                      ))}
                    </div>
                  )}
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