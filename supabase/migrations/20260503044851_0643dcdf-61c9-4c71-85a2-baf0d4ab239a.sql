-- 1. ai_get_low_stock_alerts: + _pdv_ids
DROP FUNCTION IF EXISTS public.ai_get_low_stock_alerts(integer, integer);

CREATE OR REPLACE FUNCTION public.ai_get_low_stock_alerts(
  _threshold integer DEFAULT 2,
  _limit     integer DEFAULT 50,
  _pdv_ids   uuid[]  DEFAULT NULL
)
RETURNS TABLE(product_name text, pdv_name text, total_quantity bigint, vendas_30d bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH stock_agg AS (
    SELECT sr.product_name, sr.pdv_id, p.name AS pdv_name, SUM(sr.quantity)::bigint AS qty
    FROM public.stock_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.is_active = true
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
      AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
    GROUP BY sr.product_name, sr.pdv_id, p.name
  ),
  sales_agg AS (
    SELECT s.product_name, s.pdv_id, COUNT(*)::bigint AS vendas_30d
    FROM public.sales_records s
    WHERE s.status = 'Concluído'
      AND s.payment_date >= now() - interval '30 days'
      AND user_can_access_pdv(auth.uid(), s.pdv_id)
      AND (_pdv_ids IS NULL OR s.pdv_id = ANY(_pdv_ids))
    GROUP BY s.product_name, s.pdv_id
  )
  SELECT st.product_name, st.pdv_name, st.qty AS total_quantity,
         COALESCE(sa.vendas_30d, 0) AS vendas_30d
  FROM stock_agg st
  LEFT JOIN sales_agg sa ON sa.product_name = st.product_name AND sa.pdv_id = st.pdv_id
  WHERE st.qty <= _threshold
    AND COALESCE(sa.vendas_30d, 0) > 0
  ORDER BY st.qty ASC, COALESCE(sa.vendas_30d, 0) DESC
  LIMIT _limit
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_low_stock_alerts(integer, integer, uuid[]) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_low_stock_alerts(integer, integer, uuid[]) TO authenticated;


-- 2. ai_get_pdv_comparison: + _pdv_ids
DROP FUNCTION IF EXISTS public.ai_get_pdv_comparison(timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.ai_get_pdv_comparison(
  _start   timestamptz,
  _end     timestamptz,
  _pdv_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(pdv_name text, sales_count bigint, revenue numeric, ticket_medio numeric)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    p.name AS pdv_name,
    COUNT(*)::bigint AS sales_count,
    COALESCE(SUM(s.amount), 0) AS revenue,
    CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(s.amount), 0) / COUNT(*) ELSE 0 END AS ticket_medio
  FROM public.sales_records s
  JOIN public.pdvs p ON p.id = s.pdv_id
  WHERE s.status = 'Concluído'
    AND s.payment_date >= _start
    AND s.payment_date <= _end
    AND user_can_access_pdv(auth.uid(), s.pdv_id)
    AND (_pdv_ids IS NULL OR s.pdv_id = ANY(_pdv_ids))
  GROUP BY p.name
  ORDER BY revenue DESC
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_pdv_comparison(timestamptz, timestamptz, uuid[]) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_pdv_comparison(timestamptz, timestamptz, uuid[]) TO authenticated;


-- 3. ai_get_financial_entries: _pdv_id uuid -> _pdv_ids uuid[]
DROP FUNCTION IF EXISTS public.ai_get_financial_entries(text, uuid, integer);

CREATE OR REPLACE FUNCTION public.ai_get_financial_entries(
  _reference_month text    DEFAULT NULL,
  _pdv_ids         uuid[]  DEFAULT NULL,
  _limit           integer DEFAULT 100
)
RETURNS TABLE(pdv_nome text, categoria text, mes_referencia text, total numeric, num_lancamentos bigint, descricoes text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(pd.name, 'Geral / Sem PDV')                              AS pdv_nome,
    fe.category                                                        AS categoria,
    TO_CHAR(fe.reference_month, 'YYYY-MM')                             AS mes_referencia,
    ROUND(SUM(fe.amount)::numeric, 2)                                  AS total,
    COUNT(*)::bigint                                                    AS num_lancamentos,
    STRING_AGG(fe.description, '; ' ORDER BY fe.amount DESC)
      FILTER (WHERE fe.description IS NOT NULL AND fe.description <> '') AS descricoes
  FROM public.financial_entries fe
  LEFT JOIN public.pdvs pd ON pd.id = fe.pdv_id
  WHERE fe.organization_id = get_user_org_id(auth.uid())
    AND (_pdv_ids IS NULL OR fe.pdv_id = ANY(_pdv_ids))
    AND (_reference_month IS NULL
         OR TO_CHAR(fe.reference_month, 'YYYY-MM') = _reference_month)
  GROUP BY pd.name, fe.category, TO_CHAR(fe.reference_month, 'YYYY-MM')
  ORDER BY mes_referencia DESC, pd.name NULLS LAST, SUM(fe.amount) DESC
  LIMIT _limit;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_financial_entries(text, uuid[], integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_financial_entries(text, uuid[], integer) TO authenticated;
