CREATE OR REPLACE FUNCTION public.ai_get_pdv_benchmark(
  _start timestamptz,
  _end   timestamptz
)
RETURNS TABLE(
  pdv_nome          text,
  faturamento       numeric,
  num_vendas        bigint,
  ticket_medio      numeric,
  media_rede_fat    numeric,
  media_rede_vendas numeric,
  media_rede_ticket numeric,
  pct_vs_media_fat  numeric,
  pct_vs_media_ticket numeric,
  ranking           bigint,
  total_pdvs        bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH base AS (
    SELECT
      p.name                                          AS pdv_nome,
      ROUND(SUM(sr.amount)::numeric, 2)              AS faturamento,
      COUNT(*)::bigint                               AS num_vendas,
      ROUND(AVG(sr.amount)::numeric, 2)             AS ticket_medio
    FROM public.sales_records sr
    JOIN public.pdvs p ON p.id = sr.pdv_id
    WHERE sr.status = 'Concluído'
      AND sr.order_time BETWEEN _start AND _end
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY p.name
  ),
  rede AS (
    SELECT
      ROUND(AVG(faturamento)::numeric, 2)  AS media_fat,
      ROUND(AVG(num_vendas)::numeric, 1)   AS media_vendas,
      ROUND(AVG(ticket_medio)::numeric, 2) AS media_ticket,
      COUNT(*)::bigint                     AS total_pdvs
    FROM base
  )
  SELECT
    b.pdv_nome,
    b.faturamento,
    b.num_vendas,
    b.ticket_medio,
    r.media_fat                                                    AS media_rede_fat,
    r.media_vendas                                                 AS media_rede_vendas,
    r.media_ticket                                                 AS media_rede_ticket,
    ROUND(100.0 * (b.faturamento - r.media_fat) / NULLIF(r.media_fat, 0), 1) AS pct_vs_media_fat,
    ROUND(100.0 * (b.ticket_medio - r.media_ticket) / NULLIF(r.media_ticket, 0), 1) AS pct_vs_media_ticket,
    RANK() OVER (ORDER BY b.faturamento DESC)                      AS ranking,
    r.total_pdvs
  FROM base b, rede r
  ORDER BY b.faturamento DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_pdv_benchmark(timestamptz, timestamptz) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_pdv_benchmark(timestamptz, timestamptz) TO authenticated, service_role;