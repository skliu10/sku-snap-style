-- Create clothing_items table
CREATE TABLE public.clothing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  generated_sku TEXT NOT NULL,
  color TEXT,
  type TEXT,
  condition TEXT,
  matched_retailer_sku TEXT,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create retailer_skus table
CREATE TABLE public.retailer_skus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_code TEXT NOT NULL UNIQUE,
  color TEXT,
  type TEXT,
  brand TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_skus ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an inventory/cataloging app)
CREATE POLICY "Anyone can view clothing items"
  ON public.clothing_items FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert clothing items"
  ON public.clothing_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update clothing items"
  ON public.clothing_items FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete clothing items"
  ON public.clothing_items FOR DELETE
  USING (true);

CREATE POLICY "Anyone can view retailer SKUs"
  ON public.retailer_skus FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert retailer SKUs"
  ON public.retailer_skus FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete retailer SKUs"
  ON public.retailer_skus FOR DELETE
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clothing_items_updated_at
  BEFORE UPDATE ON public.clothing_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-images', 'clothing-images', true);

-- Create storage policies
CREATE POLICY "Public Access to clothing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clothing-images');

CREATE POLICY "Anyone can upload clothing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clothing-images');

CREATE POLICY "Anyone can delete clothing images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'clothing-images');