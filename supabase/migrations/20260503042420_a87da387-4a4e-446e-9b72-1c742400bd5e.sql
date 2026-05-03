-- 1) ai_get_sales_timeline
CREATE OR REPLACE FUNCTION public.ai_get_sales_timeline(
  _start       timestamptz,
  _end         timestamptz,
  _granularity text    DEFAULT 'day',
  _pdv_ids     uuid[]  DEFAULT NULL
)
RETURNS TABLE(
  periodo      text,
  pdv_nome     text,
  num_vendas   bigint,
  faturamento  numeric,
  ticket_medio numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    CASE _granularity
      WHEN 'week'  THEN TO_CHAR(DATE_TRUNC('week',  sr.order_time), 'YYYY-"W"IW')
      WHEN 'month' THEN TO_CHAR(DATE_TRUNC('month', sr.order_time), 'YYYY-MM')
      ELSE              TO_CHAR(DATE_TRUNC('day',   sr.order_time), 'YYYY-MM-DD')
    END                                          AS periodo,
    p.name                                       AS pdv_nome,
    COUNT(*)::bigint                             AS num_vendas,
    ROUND(SUM(sr.amount)::numeric, 2)            AS faturamento,
    ROUND(AVG(sr.amount)::numeric, 2)            AS ticket_medio
  FROM public.sales_records sr
  JOIN public.pdvs p ON p.id = sr.pdv_id
  WHERE sr.status = 'Concluído'
    AND sr.order_time BETWEEN _start AND _end
    AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
  GROUP BY
    CASE _granularity
      WHEN 'week'  THEN TO_CHAR(DATE_TRUNC('week',  sr.order_time), 'YYYY-"W"IW')
      WHEN 'month' THEN TO_CHAR(DATE_TRUNC('month', sr.order_time), 'YYYY-MM')
      ELSE              TO_CHAR(DATE_TRUNC('day',   sr.order_time), 'YYYY-MM-DD')
    END,
    p.name
  ORDER BY periodo, p.name;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_sales_timeline(timestamptz, timestamptz, text, uuid[]) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_sales_timeline(timestamptz, timestamptz, text, uuid[]) TO authenticated;

-- 2) ai_get_product_catalog
CREATE OR REPLACE FUNCTION public.ai_get_product_catalog(
  _category text    DEFAULT NULL,
  _limit    integer DEFAULT 150
)
RETURNS TABLE(
  product_name    text,
  category        text,
  price           numeric,
  min_stock       integer,
  total_em_pdvs   bigint,
  total_pre_stock bigint,
  status_estoque  text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH stock_atual AS (
    SELECT sr.product_name, SUM(sr.quantity)::bigint AS qtd
    FROM public.stock_records sr
    WHERE sr.is_active = true
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.product_name
  ),
  pre AS (
    SELECT ps.product_name, SUM(ps.remaining_quantity)::bigint AS qtd
    FROM public.pre_stock ps
    WHERE ps.organization_id = get_user_org_id(auth.uid())
      AND ps.status IN ('available', 'partial')
    GROUP BY ps.product_name
  )
  SELECT
    pr.name                                             AS product_name,
    pr.category,
    pr.price,
    pr.min_stock,
    COALESCE(sa.qtd, 0)                                AS total_em_pdvs,
    COALESCE(p.qtd,  0)                                AS total_pre_stock,
    CASE
      WHEN COALESCE(sa.qtd, 0) = 0                                  THEN 'zerado'
      WHEN COALESCE(sa.qtd, 0) < COALESCE(pr.min_stock, 0)          THEN 'abaixo_do_minimo'
      WHEN COALESCE(sa.qtd, 0) <= COALESCE(pr.min_stock, 0) * 1.3   THEN 'no_limite'
      ELSE                                                                'ok'
    END                                                AS status_estoque
  FROM public.products pr
  LEFT JOIN stock_atual sa ON sa.product_name = pr.name
  LEFT JOIN pre p          ON p.product_name  = pr.name
  WHERE pr.organization_id = get_user_org_id(auth.uid())
    AND (_category IS NULL OR pr.category = _category)
  ORDER BY pr.category, pr.name
  LIMIT _limit;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_product_catalog(text, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_product_catalog(text, integer) TO authenticated;

-- 3) ai_get_pending_allocations
CREATE OR REPLACE FUNCTION public.ai_get_pending_allocations(
  _status text    DEFAULT 'pending',
  _limit  integer DEFAULT 50
)
RETURNS TABLE(
  produto        text,
  pdv_destino    text,
  qtd_sugerida   integer,
  status         text,
  data_criacao   date,
  data_resolucao date
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    pa.product_name                       AS produto,
    p.name                                AS pdv_destino,
    pa.suggested_quantity                 AS qtd_sugerida,
    pa.status,
    pa.created_at::date                   AS data_criacao,
    pa.resolved_at::date                  AS data_resolucao
  FROM public.pending_allocations pa
  JOIN public.pdvs p ON p.id = pa.pdv_id
  WHERE pa.organization_id = get_user_org_id(auth.uid())
    AND (_status IS NULL OR pa.status = _status)
  ORDER BY pa.created_at DESC
  LIMIT _limit;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_pending_allocations(text, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_pending_allocations(text, integer) TO authenticated;

-- 4) ai_get_upload_status
CREATE OR REPLACE FUNCTION public.ai_get_upload_status()
RETURNS TABLE(
  pdv_nome             text,
  tipo_upload          text,
  ultimo_upload        timestamptz,
  status_upload        text,
  registros            integer,
  anomalias            integer,
  dias_sem_atualizacao integer
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT DISTINCT ON (p.name, u.type)
    p.name                                                          AS pdv_nome,
    u.type::text                                                    AS tipo_upload,
    u.uploaded_at                                                   AS ultimo_upload,
    u.status::text                                                  AS status_upload,
    u.records_count                                                 AS registros,
    COALESCE(u.anomaly_count, 0)                                    AS anomalias,
    EXTRACT(DAY FROM NOW() - u.uploaded_at)::integer                AS dias_sem_atualizacao
  FROM public.uploads u
  JOIN public.pdvs p ON p.id = u.pdv_id
  WHERE user_can_access_pdv(auth.uid(), u.pdv_id)
    AND u.status = 'ready'
  ORDER BY p.name, u.type, u.uploaded_at DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_upload_status() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_upload_status() TO authenticated;

-- 5) ai_get_financial_summary_by_pdv
CREATE OR REPLACE FUNCTION public.ai_get_financial_summary_by_pdv(
  _start timestamptz,
  _end   timestamptz
)
RETURNS TABLE(
  pdv_nome    text,
  faturamento numeric,
  deducoes    numeric,
  despesas    numeric,
  resultado   numeric,
  margem_pct  numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH vendas AS (
    SELECT
      sr.pdv_id,
      ROUND(SUM(CASE WHEN sr.status = 'Concluído' THEN sr.amount ELSE 0 END)::numeric, 2) AS fat,
      ROUND(SUM(COALESCE(sr.refund_amount, 0) + COALESCE(sr.discount_amount, 0))::numeric, 2) AS ded
    FROM public.sales_records sr
    WHERE sr.order_time BETWEEN _start AND _end
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.pdv_id
  ),
  despesas AS (
    SELECT
      fe.pdv_id,
      ROUND(SUM(fe.amount)::numeric, 2) AS total_desp
    FROM public.financial_entries fe
    WHERE fe.organization_id = get_user_org_id(auth.uid())
      AND fe.reference_month BETWEEN _start::date AND _end::date
    GROUP BY fe.pdv_id
  )
  SELECT
    p.name                                               AS pdv_nome,
    COALESCE(v.fat,  0)                                  AS faturamento,
    COALESCE(v.ded,  0)                                  AS deducoes,
    COALESCE(d.total_desp, 0)                            AS despesas,
    ROUND(COALESCE(v.fat, 0)
          - COALESCE(v.ded, 0)
          - COALESCE(d.total_desp, 0), 2)                AS resultado,
    CASE
      WHEN COALESCE(v.fat, 0) = 0 THEN 0
      ELSE ROUND(
        100.0 * (COALESCE(v.fat, 0) - COALESCE(v.ded, 0) - COALESCE(d.total_desp, 0))
        / COALESCE(v.fat, 0), 1)
    END                                                  AS margem_pct
  FROM public.pdvs p
  LEFT JOIN vendas  v ON v.pdv_id = p.id
  LEFT JOIN despesas d ON d.pdv_id = p.id
  WHERE user_can_access_pdv(auth.uid(), p.id)
    AND (v.fat IS NOT NULL OR d.total_desp IS NOT NULL)
  ORDER BY resultado DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_financial_summary_by_pdv(timestamptz, timestamptz) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_financial_summary_by_pdv(timestamptz, timestamptz) TO authenticated;