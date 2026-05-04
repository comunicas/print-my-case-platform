CREATE OR REPLACE FUNCTION public.ai_get_payment_breakdown(
  _start   timestamptz,
  _end     timestamptz,
  _pdv_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(
  pdv_nome        text,
  forma_pagamento text,
  num_vendas      bigint,
  faturamento     numeric,
  pct_do_pdv      numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH pdv_totais AS (
    SELECT
      sr.pdv_id,
      SUM(sr.amount)::numeric AS total_pdv
    FROM public.sales_records sr
    WHERE sr.status = 'Concluído'
      AND sr.payment_date BETWEEN _start AND _end
      AND user_can_access_pdv(auth.uid(), sr.pdv_id)
      AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
    GROUP BY sr.pdv_id
  )
  SELECT
    p.name                                                              AS pdv_nome,
    COALESCE(sr.payment_method, 'Não informado')                        AS forma_pagamento,
    COUNT(*)::bigint                                                    AS num_vendas,
    ROUND(SUM(sr.amount)::numeric, 2)                                   AS faturamento,
    ROUND(100.0 * SUM(sr.amount) / NULLIF(pt.total_pdv, 0), 1)          AS pct_do_pdv
  FROM public.sales_records sr
  JOIN public.pdvs p  ON p.id  = sr.pdv_id
  JOIN pdv_totais pt  ON pt.pdv_id = sr.pdv_id
  WHERE sr.status = 'Concluído'
    AND sr.payment_date BETWEEN _start AND _end
    AND user_can_access_pdv(auth.uid(), sr.pdv_id)
    AND (_pdv_ids IS NULL OR sr.pdv_id = ANY(_pdv_ids))
  GROUP BY p.name, sr.payment_method, pt.total_pdv
  ORDER BY p.name, SUM(sr.amount) DESC;
$function$;

REVOKE EXECUTE ON FUNCTION public.ai_get_payment_breakdown(timestamptz, timestamptz, uuid[]) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.ai_get_payment_breakdown(timestamptz, timestamptz, uuid[]) TO authenticated;