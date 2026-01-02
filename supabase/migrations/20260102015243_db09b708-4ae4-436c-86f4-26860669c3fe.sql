-- Add catalog_pdv_id column to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS catalog_pdv_id UUID REFERENCES pdvs(id) ON DELETE SET NULL;

-- Drop existing function to change return type
DROP FUNCTION IF EXISTS public.get_public_organization(text);

-- Recreate get_public_organization with catalog_pdv_id
CREATE OR REPLACE FUNCTION public.get_public_organization(p_slug text)
RETURNS TABLE(id uuid, name text, public_slug text, catalog_code_enabled boolean, catalog_code text, catalog_pdv_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT o.id, o.name, o.public_slug, o.catalog_code_enabled, o.catalog_code, o.catalog_pdv_id
  FROM public.organizations o
  WHERE o.public_slug = p_slug
    AND o.public_catalog_enabled = true
$function$;

-- Drop existing function to change signature
DROP FUNCTION IF EXISTS public.get_public_stock(uuid);

-- Recreate get_public_stock with optional PDV filter
CREATE OR REPLACE FUNCTION public.get_public_stock(p_org_id uuid, p_pdv_id uuid DEFAULT NULL)
RETURNS TABLE(product_name text, total_quantity bigint, status text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    sr.product_name,
    SUM(sr.quantity)::BIGINT as total_quantity,
    CASE 
      WHEN SUM(sr.quantity) = 0 THEN 'unavailable'
      WHEN SUM(sr.quantity) <= 5 THEN 'low'
      ELSE 'available'
    END as status
  FROM public.stock_records sr
  INNER JOIN public.pdvs p ON sr.pdv_id = p.id
  INNER JOIN public.uploads u ON sr.upload_id = u.id
  WHERE p.organization_id = p_org_id
    AND sr.is_active = true
    AND u.status = 'ready'
    AND (p_pdv_id IS NULL OR sr.pdv_id = p_pdv_id)
  GROUP BY sr.product_name
  ORDER BY sr.product_name
$function$;