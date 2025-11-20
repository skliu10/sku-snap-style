import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClothingItemProps {
  imageUrl: string;
  sku: string;
  color?: string;
  type?: string;
  condition?: string;
  matchedSku?: string;
  confidence?: number;
  onDelete?: () => void;
}

export const ClothingItem = ({
  imageUrl,
  sku,
  color,
  type,
  condition,
  matchedSku,
  confidence,
  onDelete,
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

        {matchedSku && confidence && (
          <div className="text-xs text-muted-foreground">
            Match Confidence: {(confidence * 100).toFixed(0)}%
          </div>
        )}

        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                className="w-full mt-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this clothing item (SKU: {sku}). This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
};