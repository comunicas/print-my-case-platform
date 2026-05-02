-- 1. ai_get_stock_overview: add pdv_id and structured slots
DROP FUNCTION IF EXISTS public.ai_get_stock_overview(uuid[], integer, text);
DROP FUNCTION IF EXISTS public.ai_get_stock_overview(uuid[], integer);

CREATE OR REPLACE FUNCTION public.ai_get_stock_overview(
  _pdv_ids uuid[] DEFAULT NULL,
  _limit int DEFAULT 100,
  _product_name text DEFAULT NULL
)
RETURNS TABLE(
  product_name text,
  pdv_id uuid,
  pdv_name text,
  total_quantity bigint,
  slot_count bigint,
  slots jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.product_name,
    sr.pdv_id,
    p.name AS pdv_name,
    SUM(sr.quantity)::bigint AS total_quantity,
    COUNT(*)::bigint AS slot_count,
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'slot_number', sr.slot_number,
          'quantity', sr.quantity
        )
        ORDER BY sr.slot_number
      ),
      '[]'::jsonb
    ) AS slots
  FROM public.stock_records sr
  JOIN public.pdvs p ON p.id = sr.pdv_id
  WHERE sr.is_active = true
    AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
    AND (_product_name IS NULL OR sr.product_name ILIKE '%' || _product_name || '%')
  GROUP BY sr.product_name, sr.pdv_id, p.name
  ORDER BY sr.product_name, p.name
  LIMIT _limit
$$;

REVOKE EXECUTE ON FUNCTION public.ai_get_stock_overview(uuid[], int, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ai_get_stock_overview(uuid[], int) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ai_get_stock_overview(uuid[], int, text) TO authenticated;

-- 1b. ai_get_pdv_slot_inventory: granularidade por slot para um/múltiplos PDVs
CREATE OR REPLACE FUNCTION public.ai_get_pdv_slot_inventory(
  _pdv_ids uuid[] DEFAULT NULL,
  _limit int DEFAULT 200,
  _product_name text DEFAULT NULL
)
RETURNS TABLE(
  product_name text,
  pdv_id uuid,
  pdv_name text,
  total_quantity bigint,
  slot_count bigint,
  slots jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.product_name,
    sr.pdv_id,
    p.name AS pdv_name,
    SUM(sr.quantity)::bigint AS total_quantity,
    COUNT(*)::bigint AS slot_count,
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'slot_number', sr.slot_number,
          'quantity', sr.quantity
        )
        ORDER BY sr.slot_number
      ),
      '[]'::jsonb
    ) AS slots
  FROM public.stock_records sr
  JOIN public.pdvs p ON p.id = sr.pdv_id
  WHERE sr.is_active = true
    AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
    AND (_product_name IS NULL OR sr.product_name ILIKE '%' || _product_name || '%')
  GROUP BY sr.product_name, sr.pdv_id, p.name
  ORDER BY sr.product_name, p.name
  LIMIT _limit
$$;

REVOKE EXECUTE ON FUNCTION public.ai_get_pdv_slot_inventory(uuid[], int, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ai_get_pdv_slot_inventory(uuid[], int, text) TO authenticated;

-- 2. ai_get_zero_stock_items: add slot_numbers + GREATEST() guard
CREATE OR REPLACE FUNCTION public.ai_get_zero_stock_items(
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

-- 3. ai_get_pdv_list: NEW. The pdvs table has a `status` enum (not is_active),
-- so we derive is_active := (status = 'active').
CREATE OR REPLACE FUNCTION public.ai_get_pdv_list()
RETURNS TABLE(
  pdv_id uuid,
  pdv_name text,
  is_active boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id AS pdv_id,
    p.name AS pdv_name,
    (p.status = 'active'::pdv_status) AS is_active
  FROM public.pdvs p
  WHERE user_can_access_pdv(auth.uid(), p.id)
  ORDER BY p.name
$$;

REVOKE EXECUTE ON FUNCTION public.ai_get_pdv_list() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ai_get_pdv_list() TO authenticated;

-- 4. ai_analyze_restock_targets already uses normalized LOWER+TRIM matching
-- (verified). No change required.
