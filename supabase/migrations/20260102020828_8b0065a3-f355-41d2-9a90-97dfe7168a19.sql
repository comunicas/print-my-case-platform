-- Update function to include PDV data
DROP FUNCTION IF EXISTS public.get_public_organization(text);

CREATE OR REPLACE FUNCTION public.get_public_organization(p_slug text)
RETURNS TABLE(
  id uuid, 
  name text, 
  public_slug text, 
  catalog_code_enabled boolean, 
  catalog_code text, 
  catalog_pdv_id uuid, 
  catalog_qrcode_url text,
  pdv_name text,
  pdv_location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    o.id, 
    o.name, 
    o.public_slug, 
    o.catalog_code_enabled, 
    o.catalog_code, 
    o.catalog_pdv_id, 
    o.catalog_qrcode_url,
    p.name as pdv_name,
    p.location as pdv_location
  FROM public.organizations o
  LEFT JOIN public.pdvs p ON o.catalog_pdv_id = p.id
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
$$;