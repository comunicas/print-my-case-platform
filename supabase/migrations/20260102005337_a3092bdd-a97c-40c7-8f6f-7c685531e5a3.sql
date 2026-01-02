-- Criar função para buscar estoque público agregado por produto (corrigida)
CREATE OR REPLACE FUNCTION public.get_public_stock(p_org_id UUID)
RETURNS TABLE (
  product_name TEXT,
  total_quantity BIGINT,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  GROUP BY sr.product_name
  ORDER BY sr.product_name
$$;