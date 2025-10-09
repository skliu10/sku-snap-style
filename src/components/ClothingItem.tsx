import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface ClothingItemProps {
  imageUrl: string;
  sku: string;
  color?: string;
  type?: string;
  condition?: string;
  matchedSku?: string;
  confidence?: number;
}

export const ClothingItem = ({
  imageUrl,
  sku,
  color,
  type,
  condition,
  matchedSku,
  confidence,
}: ClothingItemProps) => {
  return (
    <Card className="overflow-hidden shadow-card transition-smooth hover:shadow-elegant">
      <div className="relative aspect-square bg-muted">
        <img
          src={imageUrl}
          alt={sku}
          className="w-full h-full object-cover"
        />
        {matchedSku && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg">{sku}</h3>
          {matchedSku && (
            <p className="text-sm text-muted-foreground">
              Matched: {matchedSku}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {type && (
            <Badge variant="secondary" className="capitalize">
              {type}
            </Badge>
          )}
          {color && (
            <Badge variant="outline" className="capitalize">
              {color}
            </Badge>
          )}
          {condition && (
            <Badge variant="outline" className="capitalize">
              {condition}
            </Badge>
          )}
        </div>

        {confidence && (
          <div className="text-xs text-muted-foreground">
            Confidence: {(confidence * 100).toFixed(0)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};