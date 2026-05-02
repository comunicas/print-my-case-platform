-- Expose source PDV names with available stock for zero-stock analysis
DROP FUNCTION IF EXISTS public.ai_get_zero_stock_items(uuid[], integer);

CREATE FUNCTION public.ai_get_zero_stock_items(
  _pdv_ids uuid[] DEFAULT NULL,
  _limit integer DEFAULT 100
)
RETURNS TABLE(
  product_name text,
  pdv_id uuid,
  pdv_name text,
  total_quantity bigint,
  slot_count bigint,
  zero_slot_count bigint,
  slot_numbers text,
  network_total_quantity bigint,
  stock_in_other_pdvs bigint,
  available_in text,
  zero_scope text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH per_pdv AS (
    SELECT
      sr.product_name,
      sr.pdv_id,
      p.name AS pdv_name,
      SUM(sr.quantity)::bigint AS total_quantity,
      COUNT(*)::bigint AS slot_count,
      COUNT(*) FILTER (WHERE sr.quantity = 0)::bigint AS zero_slot_count,
      STRING_AGG(sr.slot_number::text, ', ' ORDER BY sr.slot_number) AS slot_numbers
    FROM public.stock_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.is_active = true
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
      AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
    GROUP BY sr.product_name, sr.pdv_id, p.name
  ),
  network AS (
    SELECT pp.product_name, SUM(pp.total_quantity)::bigint AS network_total
    FROM per_pdv pp
    GROUP BY pp.product_name
  )
  SELECT
    pp.product_name,
    pp.pdv_id,
    pp.pdv_name,
    pp.total_quantity,
    pp.slot_count,
    pp.zero_slot_count,
    pp.slot_numbers,
    n.network_total AS network_total_quantity,
    GREATEST(0, n.network_total - pp.total_quantity)::bigint AS stock_in_other_pdvs,
    (
      SELECT STRING_AGG(format('%s (%s un)', src.pdv_name, src.total_quantity), ', ' ORDER BY src.total_quantity DESC, src.pdv_name)
      FROM per_pdv src
      WHERE src.product_name = pp.product_name
        AND src.pdv_id <> pp.pdv_id
        AND src.total_quantity > 0
    ) AS available_in,
    CASE
      WHEN n.network_total = 0 THEN 'zero_in_network'
      ELSE 'zero_in_pdv_only'
    END AS zero_scope
  FROM per_pdv pp
  JOIN network n ON n.product_name = pp.product_name
  WHERE pp.total_quantity = 0
  ORDER BY pp.product_name, pp.pdv_name
  LIMIT _limit
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_zero_stock_items(uuid[], integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ai_get_zero_stock_items(uuid[], integer) TO authenticated;
