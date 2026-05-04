
-- ============================================================
-- 1) ai_get_pdv_metrics
-- ============================================================
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
      AND sr.order_time BETWEEN p.inicio AND p.fim
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

REVOKE EXECUTE ON FUNCTION public.ai_get_pdv_metrics(integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_pdv_metrics(integer) TO authenticated;

-- ============================================================
-- 2) ai_get_sales_projection
-- ============================================================
CREATE OR REPLACE FUNCTION public.ai_get_sales_projection(
  _meta_liquida_por_pdv numeric,
  _days_baseline integer DEFAULT 90
)
RETURNS TABLE(
  pdv_nome                       text,
  ticket_medio                   numeric,
  vendas_por_dia_atual           numeric,
  taxa_deducao_pct               numeric,
  despesas_mes_medio             numeric,
  faturamento_mes_atual          numeric,
  dias_decorridos_mes            integer,
  dias_restantes_mes             integer,
  projecao_fim_mes               numeric,
  meta_liquida                   numeric,
  meta_bruta_necessaria          numeric,
  faturamento_restante_necessario numeric,
  vendas_necessarias_restantes   numeric,
  vendas_por_dia_necessarias     numeric,
  gap_vendas_por_dia             numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH mes AS (
    SELECT
      date_trunc('month', NOW())                                                AS inicio_mes,
      (date_trunc('month', NOW()) + interval '1 month')                         AS inicio_prox_mes,
      EXTRACT(DAY FROM (date_trunc('month', NOW()) + interval '1 month' - interval '1 day'))::int AS dias_no_mes,
      EXTRACT(DAY FROM NOW())::int                                              AS dia_atual
  ),
  baseline_periodo AS (
    SELECT
      NOW() - (_days_baseline || ' days')::interval AS inicio,
      NOW()                                         AS fim
  ),
  baseline AS (
    SELECT
      sr.pdv_id,
      ROUND(AVG(sr.amount)::numeric, 2)                                AS ticket_medio,
      ROUND(COUNT(*)::numeric / GREATEST(_days_baseline, 1), 2)        AS vendas_por_dia,
      ROUND(
        100.0 * SUM(COALESCE(sr.refund_amount,0) + COALESCE(sr.discount_amount,0))
        / NULLIF(SUM(sr.amount), 0), 2
      )                                                                 AS taxa_deducao_pct
    FROM public.sales_records sr, baseline_periodo bp
    WHERE sr.status = 'Concluído'
      AND sr.order_time BETWEEN bp.inicio AND bp.fim
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.pdv_id
  ),
  mes_atual AS (
    SELECT
      sr.pdv_id,
      ROUND(SUM(sr.amount)::numeric, 2) AS faturamento_mes
    FROM public.sales_records sr, mes m
    WHERE sr.status = 'Concluído'
      AND sr.order_time >= m.inicio_mes
      AND sr.order_time <  m.inicio_prox_mes
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    GROUP BY sr.pdv_id
  ),
  despesas AS (
    SELECT
      fe.pdv_id,
      ROUND(SUM(fe.amount)::numeric / GREATEST((_days_baseline::numeric / 30.0), 1), 2) AS despesas_mes_medio
    FROM public.financial_entries fe, baseline_periodo bp
    WHERE fe.organization_id = get_user_org_id(auth.uid())
      AND fe.reference_month BETWEEN bp.inicio::date AND bp.fim::date
    GROUP BY fe.pdv_id
  ),
  calc AS (
    SELECT
      p.id                                                  AS pdv_id,
      p.name                                                AS pdv_nome,
      COALESCE(b.ticket_medio, 0)                           AS ticket_medio,
      COALESCE(b.vendas_por_dia, 0)                         AS vendas_por_dia_atual,
      COALESCE(b.taxa_deducao_pct, 0)                       AS taxa_deducao_pct,
      COALESCE(d.despesas_mes_medio, 0)                     AS despesas_mes_medio,
      COALESCE(ma.faturamento_mes, 0)                       AS faturamento_mes_atual,
      m.dia_atual                                           AS dias_decorridos_mes,
      GREATEST(m.dias_no_mes - m.dia_atual, 0)              AS dias_restantes_mes,
      m.dias_no_mes                                         AS dias_no_mes
    FROM public.pdvs p
    CROSS JOIN mes m
    LEFT JOIN baseline   b  ON b.pdv_id  = p.id
    LEFT JOIN mes_atual  ma ON ma.pdv_id = p.id
    LEFT JOIN despesas   d  ON d.pdv_id  = p.id
    WHERE user_can_access_pdv(auth.uid(), p.id)
      AND b.vendas_por_dia IS NOT NULL
  )
  SELECT
    c.pdv_nome,
    c.ticket_medio,
    c.vendas_por_dia_atual,
    c.taxa_deducao_pct,
    c.despesas_mes_medio,
    c.faturamento_mes_atual,
    c.dias_decorridos_mes,
    c.dias_restantes_mes,
    ROUND(c.faturamento_mes_atual + (c.vendas_por_dia_atual * c.ticket_medio * c.dias_restantes_mes), 2) AS projecao_fim_mes,
    _meta_liquida_por_pdv AS meta_liquida,
    ROUND(
      (_meta_liquida_por_pdv + c.despesas_mes_medio)
      / NULLIF(1 - (c.taxa_deducao_pct / 100.0), 0), 2
    ) AS meta_bruta_necessaria,
    ROUND(GREATEST(
      ((_meta_liquida_por_pdv + c.despesas_mes_medio) / NULLIF(1 - (c.taxa_deducao_pct / 100.0), 0))
      - c.faturamento_mes_atual, 0
    ), 2) AS faturamento_restante_necessario,
    ROUND(
      GREATEST(
        ((_meta_liquida_por_pdv + c.despesas_mes_medio) / NULLIF(1 - (c.taxa_deducao_pct / 100.0), 0))
        - c.faturamento_mes_atual, 0
      ) / NULLIF(c.ticket_medio, 0), 2
    ) AS vendas_necessarias_restantes,
    ROUND(
      (
        GREATEST(
          ((_meta_liquida_por_pdv + c.despesas_mes_medio) / NULLIF(1 - (c.taxa_deducao_pct / 100.0), 0))
          - c.faturamento_mes_atual, 0
        ) / NULLIF(c.ticket_medio, 0)
      ) / NULLIF(c.dias_restantes_mes, 0), 2
    ) AS vendas_por_dia_necessarias,
    ROUND(
      (
        (
          GREATEST(
            ((_meta_liquida_por_pdv + c.despesas_mes_medio) / NULLIF(1 - (c.taxa_deducao_pct / 100.0), 0))
            - c.faturamento_mes_atual, 0
          ) / NULLIF(c.ticket_medio, 0)
        ) / NULLIF(c.dias_restantes_mes, 0)
      ) - c.vendas_por_dia_atual, 2
    ) AS gap_vendas_por_dia
  FROM calc c
  ORDER BY c.pdv_nome;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_sales_projection(numeric, integer) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_sales_projection(numeric, integer) TO authenticated;

-- ============================================================
-- 3) Registrar as duas tools em ai_agent_tools (idempotente)
-- ============================================================
INSERT INTO public.ai_agent_tools (name, enabled, category, description, parameters_schema, handler_name, display_order)
VALUES
(
  'get_pdv_metrics',
  true,
  'analytics',
  'Métricas consolidadas por PDV em uma janela de dias (default 90): ticket médio, vendas/dia, faturamento/dia, taxa de dedução (%) e despesas mensais médias. Use SEMPRE como base para perguntas de projeção, meta, "quanto precisamos vender", "ritmo atual", "quanto cada PDV produz por dia".',
  '{"type":"object","properties":{"days":{"type":"integer","default":90,"description":"Janela em dias para baseline (30, 60, 90)."}}}'::jsonb,
  'ai_get_pdv_metrics',
  100
),
(
  'get_sales_projection',
  true,
  'analytics',
  'Projeta o fechamento do mês corrente por PDV e calcula meta reversa: dado um lucro LÍQUIDO mensal alvo por PDV, retorna meta bruta necessária = (meta_liquida + despesas) / (1 - taxa_deducao), faturamento restante, vendas necessárias e vendas/dia necessárias para o restante do mês, com gap vs ritmo atual. Use para perguntas como "para faturar líquido R$ X por PDV este mês, quanto preciso vender?".',
  '{"type":"object","properties":{"meta_liquida_por_pdv":{"type":"number","description":"Meta de lucro LÍQUIDO mensal por PDV em reais."},"days_baseline":{"type":"integer","default":90,"description":"Janela em dias para calcular ticket médio, ritmo e taxa de dedução."}},"required":["meta_liquida_por_pdv"]}'::jsonb,
  'ai_get_sales_projection',
  101
)
ON CONFLICT (name) DO UPDATE SET
  enabled           = EXCLUDED.enabled,
  category          = EXCLUDED.category,
  description       = EXCLUDED.description,
  parameters_schema = EXCLUDED.parameters_schema,
  handler_name      = EXCLUDED.handler_name,
  display_order     = EXCLUDED.display_order,
  updated_at        = now();
