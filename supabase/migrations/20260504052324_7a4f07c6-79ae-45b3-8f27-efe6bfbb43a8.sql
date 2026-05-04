-- 1) Normaliza status legado em inglês para o canônico em português
UPDATE public.sales_records
SET status = 'Concluído'
WHERE status = 'Completed';

-- 2) ai_get_pdv_metrics agora usa payment_date (igual dashboard)
CREATE OR REPLACE FUNCTION public.ai_get_pdv_metrics(
  _days integer DEFAULT 90
)
RETURNS TABLE(
  pdv_nome            text,
  dias_analisados     integer,
  total_vendas        bigint,
  faturamento_total   numeric,
  ticket_medio        numeric,
  vendas_por_dia      numeric,
  faturamento_por_dia numeric,
  taxa_deducao_pct    numeric,
  despesas_mes_medio  numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH periodo AS (
    SELECT
      NOW() - (_days || ' days')::interval AS inicio,
      NOW()                                AS fim
  ),
  vendas AS (
    SELECT
      sr.pdv_id,
      COUNT(*)::bigint                                                         AS total_vendas,
      ROUND(SUM(sr.amount)::numeric, 2)                                        AS faturamento,
      ROUND(AVG(sr.amount)::numeric, 2)                                        AS ticket_medio,
      ROUND(COUNT(*)::numeric / GREATEST(_days, 1), 2)                         AS vendas_por_dia,
      ROUND(SUM(sr.amount)::numeric / GREATEST(_days, 1), 2)                   AS fat_por_dia,
      ROUND(
        100.0 * SUM(COALESCE(sr.refund_amount, 0) + COALESCE(sr.discount_amount, 0))
        / NULLIF(SUM(sr.amount), 0), 2
      )                                                                         AS taxa_deducao_pct
    FROM public.sales_records sr, periodo p
    WHERE sr.status = 'Concluído'
      AND sr.payment_date BETWEEN p.inicio AND p.fim
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.pdv_id
  ),
  despesas AS (
    SELECT
      fe.pdv_id,
      ROUND(SUM(fe.amount)::numeric / GREATEST((_days::numeric / 30.0), 1), 2) AS despesas_mes_medio
    FROM public.financial_entries fe, periodo p
    WHERE fe.organization_id = get_user_org_id(auth.uid())
      AND fe.reference_month BETWEEN p.inicio::date AND p.fim::date
    GROUP BY fe.pdv_id
  )
  SELECT
    p.name                            AS pdv_nome,
    _days                             AS dias_analisados,
    COALESCE(v.total_vendas, 0)       AS total_vendas,
    COALESCE(v.faturamento, 0)        AS faturamento_total,
    COALESCE(v.ticket_medio, 0)      AS ticket_medio,
    COALESCE(v.vendas_por_dia, 0)    AS vendas_por_dia,
    COALESCE(v.fat_por_dia, 0)       AS faturamento_por_dia,
    COALESCE(v.taxa_deducao_pct, 0)  AS taxa_deducao_pct,
    COALESCE(d.despesas_mes_medio, 0) AS despesas_mes_medio
  FROM public.pdvs p
  LEFT JOIN vendas   v ON v.pdv_id = p.id
  LEFT JOIN despesas d ON d.pdv_id = p.id
  WHERE user_can_access_pdv(auth.uid(), p.id)
    AND v.total_vendas IS NOT NULL
  ORDER BY v.faturamento DESC NULLS LAST;
$function$;

-- 3) ai_get_sales_projection agora usa payment_date
DROP FUNCTION IF EXISTS public.ai_get_sales_projection(numeric, integer);

CREATE FUNCTION public.ai_get_sales_projection(
  _target_net_per_pdv numeric DEFAULT NULL,
  _days_baseline      integer DEFAULT 90
)
RETURNS TABLE(
  pdv_nome                   text,
  faturamento_ate_hoje       numeric,
  vendas_ate_hoje            bigint,
  dias_corridos              integer,
  dias_restantes             integer,
  projecao_mes               numeric,
  projecao_liquida           numeric,
  meta_bruta_necessaria      numeric,
  vendas_necessarias         bigint,
  vendas_por_dia_necessarias numeric,
  gap_projecao_vs_meta       numeric,
  status_meta                text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH hoje AS (
    SELECT
      DATE_TRUNC('month', NOW())                      AS inicio_mes,
      NOW()                                           AS agora,
      DATE_TRUNC('month', NOW()) + interval '1 month' AS inicio_proximo_mes
  ),
  dias_mes AS (
    SELECT
      EXTRACT(DAY FROM h.agora - h.inicio_mes)::integer            AS corridos,
      EXTRACT(DAY FROM h.inicio_proximo_mes - h.agora)::integer    AS restantes,
      EXTRACT(DAY FROM h.inicio_proximo_mes - h.inicio_mes)::integer AS total_mes
    FROM hoje h
  ),
  mes_atual AS (
    SELECT
      sr.pdv_id,
      COUNT(*)::bigint                  AS vendas_mes,
      ROUND(SUM(sr.amount)::numeric, 2) AS fat_mes
    FROM public.sales_records sr, hoje h
    WHERE sr.status = 'Concluído'
      AND sr.payment_date BETWEEN h.inicio_mes AND h.agora
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.pdv_id
  ),
  baseline AS (
    SELECT
      sr.pdv_id,
      ROUND(AVG(sr.amount)::numeric, 2)                              AS ticket_medio,
      ROUND(COUNT(*)::numeric / GREATEST(_days_baseline,1), 2)       AS vendas_por_dia,
      ROUND(SUM(sr.amount)::numeric / GREATEST(_days_baseline,1), 2) AS fat_por_dia,
      ROUND(
        SUM(COALESCE(sr.refund_amount,0) + COALESCE(sr.discount_amount,0))::numeric
        / NULLIF(SUM(sr.amount),0), 4
      )                                                               AS taxa_ded_decimal
    FROM public.sales_records sr
    WHERE sr.status = 'Concluído'
      AND sr.payment_date >= NOW() - (_days_baseline || ' days')::interval
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.pdv_id
  ),
  despesas_mes AS (
    SELECT
      fe.pdv_id,
      ROUND(SUM(fe.amount)::numeric, 2) AS despesas
    FROM public.financial_entries fe, hoje h
    WHERE fe.organization_id = get_user_org_id(auth.uid())
      AND TO_CHAR(fe.reference_month, 'YYYY-MM') = TO_CHAR(h.inicio_mes, 'YYYY-MM')
    GROUP BY fe.pdv_id
  )
  SELECT
    p.name                                                AS pdv_nome,
    COALESCE(ma.fat_mes, 0)                               AS faturamento_ate_hoje,
    COALESCE(ma.vendas_mes, 0)                            AS vendas_ate_hoje,
    dm.corridos                                           AS dias_corridos,
    dm.restantes                                          AS dias_restantes,
    ROUND(
      COALESCE(ma.fat_mes, 0)
      + COALESCE(b.fat_por_dia, 0) * dm.restantes, 2
    )                                                     AS projecao_mes,
    ROUND(
      (COALESCE(ma.fat_mes, 0) + COALESCE(b.fat_por_dia, 0) * dm.restantes)
      * (1 - COALESCE(b.taxa_ded_decimal, 0))
      - COALESCE(dm2.despesas, 0), 2
    )                                                     AS projecao_liquida,
    CASE
      WHEN _target_net_per_pdv IS NULL THEN NULL
      ELSE ROUND(
        (_target_net_per_pdv + COALESCE(dm2.despesas, 0))
        / NULLIF(1 - COALESCE(b.taxa_ded_decimal, 0), 0), 2
      )
    END                                                   AS meta_bruta_necessaria,
    CASE
      WHEN _target_net_per_pdv IS NULL OR COALESCE(b.ticket_medio, 0) = 0 THEN NULL
      ELSE CEIL(
        ((_target_net_per_pdv + COALESCE(dm2.despesas, 0))
          / NULLIF(1 - COALESCE(b.taxa_ded_decimal, 0), 0))
        / b.ticket_medio
      )::bigint
    END                                                   AS vendas_necessarias,
    CASE
      WHEN _target_net_per_pdv IS NULL OR dm.restantes = 0 OR COALESCE(b.ticket_medio, 0) = 0 THEN NULL
      ELSE ROUND(
        (
          ((_target_net_per_pdv + COALESCE(dm2.despesas, 0))
            / NULLIF(1 - COALESCE(b.taxa_ded_decimal, 0), 0))
          - COALESCE(ma.fat_mes, 0)
        )
        / NULLIF(b.ticket_medio * dm.restantes, 0), 1
      )
    END                                                   AS vendas_por_dia_necessarias,
    CASE
      WHEN _target_net_per_pdv IS NULL THEN NULL
      ELSE ROUND(
        (COALESCE(ma.fat_mes, 0) + COALESCE(b.fat_por_dia, 0) * dm.restantes)
        - ((_target_net_per_pdv + COALESCE(dm2.despesas, 0))
            / NULLIF(1 - COALESCE(b.taxa_ded_decimal, 0), 0)), 2
      )
    END                                                   AS gap_projecao_vs_meta,
    CASE
      WHEN _target_net_per_pdv IS NULL THEN 'sem_meta_definida'
      WHEN (COALESCE(ma.fat_mes, 0) + COALESCE(b.fat_por_dia, 0) * dm.restantes)
            >= ((_target_net_per_pdv + COALESCE(dm2.despesas, 0))
                / NULLIF(1 - COALESCE(b.taxa_ded_decimal, 0), 0))
      THEN 'no_ritmo'
      ELSE 'abaixo_do_ritmo'
    END                                                   AS status_meta
  FROM public.pdvs p
  LEFT JOIN mes_atual    ma  ON ma.pdv_id  = p.id
  LEFT JOIN baseline     b   ON b.pdv_id   = p.id
  LEFT JOIN despesas_mes dm2 ON dm2.pdv_id = p.id
  CROSS JOIN dias_mes dm
  WHERE user_can_access_pdv(auth.uid(), p.id)
    AND (ma.fat_mes IS NOT NULL OR b.fat_por_dia IS NOT NULL)
  ORDER BY COALESCE(ma.fat_mes, 0) DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_sales_projection(numeric, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_sales_projection(numeric, integer) TO authenticated;

-- 4) ai_get_pdv_benchmark agora usa payment_date
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
      AND sr.payment_date BETWEEN _start AND _end
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
GRANT  EXECUTE ON FUNCTION public.ai_get_pdv_benchmark(timestamptz, timestamptz) TO authenticated;

-- 5) RPC unificada de KPIs do dashboard (sem cap de 1000 linhas do PostgREST)
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_start_date   timestamptz,
  p_end_date     timestamptz,
  p_prev_start   timestamptz,
  p_prev_end     timestamptz,
  p_pdv_ids      uuid[] DEFAULT NULL
)
RETURNS TABLE(
  gross_revenue              numeric,
  total_refunds              numeric,
  refunded_transactions      bigint,
  transactions               bigint,
  card_revenue               numeric,
  total_cancellations        numeric,
  cancelled_transactions     bigint,
  prev_gross_revenue         numeric,
  prev_total_refunds         numeric,
  prev_transactions          bigint,
  prev_total_cancellations   numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH cur_completed AS (
    SELECT amount, COALESCE(refund_amount, 0) AS refund_amount, payment_method
    FROM public.sales_records
    WHERE status = 'Concluído'
      AND payment_date >= p_start_date
      AND payment_date <= p_end_date
      AND user_can_access_pdv(auth.uid(), pdv_id)
      AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
  ),
  cur_cancelled AS (
    SELECT amount
    FROM public.sales_records
    WHERE status = 'Cancelado'
      AND payment_date >= p_start_date
      AND payment_date <= p_end_date
      AND user_can_access_pdv(auth.uid(), pdv_id)
      AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
  ),
  prev_completed AS (
    SELECT amount, COALESCE(refund_amount, 0) AS refund_amount
    FROM public.sales_records
    WHERE status = 'Concluído'
      AND payment_date >= p_prev_start
      AND payment_date <= p_prev_end
      AND user_can_access_pdv(auth.uid(), pdv_id)
      AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
  ),
  prev_cancelled AS (
    SELECT amount
    FROM public.sales_records
    WHERE status = 'Cancelado'
      AND payment_date >= p_prev_start
      AND payment_date <= p_prev_end
      AND user_can_access_pdv(auth.uid(), pdv_id)
      AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
  )
  SELECT
    COALESCE((SELECT SUM(amount) FROM cur_completed), 0)::numeric                                      AS gross_revenue,
    COALESCE((SELECT SUM(refund_amount) FROM cur_completed), 0)::numeric                               AS total_refunds,
    COALESCE((SELECT COUNT(*) FROM cur_completed WHERE refund_amount > 0), 0)::bigint                  AS refunded_transactions,
    COALESCE((SELECT COUNT(*) FROM cur_completed), 0)::bigint                                          AS transactions,
    COALESCE((SELECT SUM(amount) FROM cur_completed
              WHERE payment_method IN ('Cartão de Crédito','Cartão de Débito')), 0)::numeric            AS card_revenue,
    COALESCE((SELECT SUM(amount) FROM cur_cancelled), 0)::numeric                                      AS total_cancellations,
    COALESCE((SELECT COUNT(*) FROM cur_cancelled), 0)::bigint                                          AS cancelled_transactions,
    COALESCE((SELECT SUM(amount) FROM prev_completed), 0)::numeric                                     AS prev_gross_revenue,
    COALESCE((SELECT SUM(refund_amount) FROM prev_completed), 0)::numeric                              AS prev_total_refunds,
    COALESCE((SELECT COUNT(*) FROM prev_completed), 0)::bigint                                         AS prev_transactions,
    COALESCE((SELECT SUM(amount) FROM prev_cancelled), 0)::numeric                                     AS prev_total_cancellations;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_kpis(timestamptz, timestamptz, timestamptz, timestamptz, uuid[]) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.get_dashboard_kpis(timestamptz, timestamptz, timestamptz, timestamptz, uuid[]) TO authenticated;