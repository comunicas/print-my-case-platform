
-- Add new columns to pdv_catalog_settings
ALTER TABLE public.pdv_catalog_settings
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public_enabled BOOLEAN DEFAULT false;

-- Migrate existing data from organizations to pdv_catalog_settings
-- First update existing records
UPDATE public.pdv_catalog_settings pcs
SET public_slug = o.public_slug,
    is_public_enabled = true
FROM public.organizations o
WHERE o.catalog_pdv_id = pcs.pdv_id
  AND o.public_catalog_enabled = true
  AND o.public_slug IS NOT NULL;

-- Insert for PDVs that don't have a record yet
INSERT INTO public.pdv_catalog_settings (pdv_id, public_slug, is_public_enabled)
SELECT o.catalog_pdv_id, o.public_slug, true
FROM public.organizations o
WHERE o.public_catalog_enabled = true
  AND o.catalog_pdv_id IS NOT NULL
  AND o.public_slug IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.pdv_catalog_settings pcs WHERE pcs.pdv_id = o.catalog_pdv_id
  );

-- Update get_public_organization to search pdv_catalog_settings first, fallback to organizations
CREATE OR REPLACE FUNCTION public.get_public_organization(p_slug text)
 RETURNS TABLE(id uuid, name text, public_slug text, catalog_code_enabled boolean, catalog_code text, catalog_pdv_id uuid, catalog_qrcode_url text, pdv_name text, pdv_location text, catalog_modal_text text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- First try to find slug in pdv_catalog_settings
  SELECT 
    o.id, 
    o.name, 
    pcs.public_slug, 
    COALESCE(pcs.is_enabled, false) as catalog_code_enabled,
    pcs.catalog_code,
    p.id as catalog_pdv_id, 
    pcs.catalog_qrcode_url,
    p.name as pdv_name,
    p.location as pdv_location,
    pcs.catalog_modal_text
  FROM public.pdv_catalog_settings pcs
  INNER JOIN public.pdvs p ON pcs.pdv_id = p.id
  INNER JOIN public.organizations o ON p.organization_id = o.id
  WHERE pcs.public_slug = p_slug
    AND pcs.is_public_enabled = true

  UNION ALL

  -- Fallback: search in organizations table
  SELECT 
    o.id, 
    o.name, 
    o.public_slug, 
    COALESCE(pcs_fallback.is_enabled, o.catalog_code_enabled) as catalog_code_enabled,
    COALESCE(pcs_fallback.catalog_code, o.catalog_code) as catalog_code,
    o.catalog_pdv_id, 
    COALESCE(pcs_fallback.catalog_qrcode_url, o.catalog_qrcode_url) as catalog_qrcode_url,
    p.name as pdv_name,
    p.location as pdv_location,
    COALESCE(pcs_fallback.catalog_modal_text, o.catalog_modal_text) as catalog_modal_text
  FROM public.organizations o
  LEFT JOIN public.pdvs p ON o.catalog_pdv_id = p.id
  LEFT JOIN public.pdv_catalog_settings pcs_fallback ON o.catalog_pdv_id = pcs_fallback.pdv_id AND pcs_fallback.is_enabled = true
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
    AND NOT EXISTS (
      SELECT 1 FROM public.pdv_catalog_settings pcs2
      WHERE pcs2.public_slug = p_slug AND pcs2.is_public_enabled = true
    )

  LIMIT 1
$function$;
