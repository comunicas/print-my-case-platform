-- Add catalog_modal_text column to pdv_catalog_settings
ALTER TABLE pdv_catalog_settings 
ADD COLUMN catalog_modal_text TEXT DEFAULT NULL;

-- Update get_public_organization to use COALESCE for modal text
CREATE OR REPLACE FUNCTION public.get_public_organization(p_slug text)
 RETURNS TABLE(id uuid, name text, public_slug text, catalog_code_enabled boolean, catalog_code text, catalog_pdv_id uuid, catalog_qrcode_url text, pdv_name text, pdv_location text, catalog_modal_text text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    o.id, 
    o.name, 
    o.public_slug, 
    COALESCE(pcs.is_enabled, o.catalog_code_enabled) as catalog_code_enabled,
    COALESCE(pcs.catalog_code, o.catalog_code) as catalog_code,
    o.catalog_pdv_id, 
    COALESCE(pcs.catalog_qrcode_url, o.catalog_qrcode_url) as catalog_qrcode_url,
    p.name as pdv_name,
    p.location as pdv_location,
    COALESCE(pcs.catalog_modal_text, o.catalog_modal_text) as catalog_modal_text
  FROM public.organizations o
  LEFT JOIN public.pdvs p ON o.catalog_pdv_id = p.id
  LEFT JOIN public.pdv_catalog_settings pcs ON o.catalog_pdv_id = pcs.pdv_id AND pcs.is_enabled = true
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
$function$;