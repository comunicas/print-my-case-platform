
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
      AND sr.order_time BETWEEN h.inicio_mes AND h.agora
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
      AND sr.order_time >= NOW() - (_days_baseline || ' days')::interval
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

UPDATE public.ai_agent_tools
SET
  description = 'Projeta o fechamento do mês corrente por PDV (faturamento até hoje + ritmo dos dias restantes) e, se uma meta líquida por PDV for informada, calcula meta bruta = (meta_liquida + despesas_do_mês) / (1 - taxa_dedução), vendas necessárias, vendas/dia necessárias, gap e status_meta (no_ritmo / abaixo_do_ritmo / sem_meta_definida). Sem meta, retorna apenas projeção e projeção líquida.',
  parameters_schema = '{"type":"object","properties":{"target_net_per_pdv":{"type":"number","description":"Meta de lucro LÍQUIDO mensal por PDV (R$). Omitir = só projeção, sem meta reversa."},"days_baseline":{"type":"integer","default":90,"description":"Janela em dias para ticket médio, ritmo e taxa de dedução."}}}'::jsonb,
  updated_at = now()
WHERE name = 'get_sales_projection';
