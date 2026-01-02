-- Add catalog_qrcode_url column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS catalog_qrcode_url TEXT;

-- Update get_public_organization function to return catalog_qrcode_url
DROP FUNCTION IF EXISTS public.get_public_organization(text);

CREATE OR REPLACE FUNCTION public.get_public_organization(p_slug text)
RETURNS TABLE(id uuid, name text, public_slug text, catalog_code_enabled boolean, catalog_code text, catalog_pdv_id uuid, catalog_qrcode_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.id, o.name, o.public_slug, o.catalog_code_enabled, o.catalog_code, o.catalog_pdv_id, o.catalog_qrcode_url
  FROM public.organizations o
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
$$;

-- Create storage bucket for catalog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-images', 'catalog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for admins to upload catalog images
CREATE POLICY "Admins can upload catalog images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'catalog-images' 
  AND is_admin(auth.uid())
);

-- Policy for public read access
CREATE POLICY "Public can view catalog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'catalog-images');

-- Policy for admins to delete catalog images
CREATE POLICY "Admins can delete catalog images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'catalog-images' 
  AND is_admin(auth.uid())
);