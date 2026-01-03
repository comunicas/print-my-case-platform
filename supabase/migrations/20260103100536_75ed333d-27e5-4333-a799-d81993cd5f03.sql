-- Fix: Remove total_quantity from public stock API response to prevent competitor intelligence gathering
-- The function now only returns product_name and status (available/low/unavailable)
-- Quantity thresholds are kept internal (0, ≤5, >5) without exposing actual numbers

-- First drop the existing function with the old return type
DROP FUNCTION IF EXISTS public.get_public_stock(uuid, uuid);

-- Recreate with new return type (without total_quantity)
CREATE OR REPLACE FUNCTION public.get_public_stock(p_org_id uuid, p_pdv_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(product_name text, status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    sr.product_name,
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