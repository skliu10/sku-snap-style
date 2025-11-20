import { useState, useRef } from "react";
import { Camera, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CameraUploadProps {
  onAnalysisComplete: () => void;
}

export const CameraUpload = ({ onAnalysisComplete }: CameraUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsProcessing(true);

    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('clothing-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clothing-images')
        .getPublicUrl(filePath);

      // Analyze the image
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-clothing',
        { body: { imageUrl: publicUrl } }
      );

      if (analysisError) throw analysisError;

      // Save to database
      const { error: dbError } = await supabase
        .from('clothing_items')
        .insert({
          image_url: publicUrl,
          generated_sku: analysisData.sku,
          color: analysisData.color,
          type: analysisData.type,
          condition: analysisData.condition,
        });

      if (dbError) throw dbError;

      toast({
        title: "Item categorized!",
        description: `Generated SKU: ${analysisData.sku}`,
      });

      onAnalysisComplete();
      setPreviewUrl(null);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-8 shadow-card transition-smooth hover:shadow-elegant">
      <div className="flex flex-col items-center space-y-6">
        <div className="w-full max-w-md">
          {previewUrl ? (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
              <Camera className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="gradient-primary"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </>
            )}
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
      </div>
    </Card>
  );
};