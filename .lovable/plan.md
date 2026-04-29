## Implementar RPC de métricas globais do super_admin e remover HEAD counts do dashboard

### Diagnóstico

`src/hooks/useDashboard.ts` (linhas 196–199) faz dois `HEAD count: "exact"` em `organizations` e `pdvs` que retornam 503. As policies SELECT cobrem super_admin corretamente (`is_super_admin(auth.uid())`) — o 503 é timeout do PostgREST, não bloqueio de RLS: o COUNT respeitando RLS varre todas as linhas executando `is_super_admin()` por linha e estoura `statement_timeout`. O `try/catch` silencia o erro e o card "Visão Consolidada" mostra 0.

### Correção

Substituir os 3 fetches paralelos do bloco `if (isSuperAdmin)` por uma única RPC `SECURITY DEFINER` que retorna métricas globais agregadas em uma round-trip.

### 1. Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.get_super_admin_global_metrics(
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  total_organizations bigint,
  total_pdvs_global bigint,
  total_revenue_global numeric,
  total_transactions_global bigint,
  total_refunds_global numeric,
  avg_ticket_global numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue numeric := 0;
  v_total_refunds numeric := 0;
  v_total_tx bigint := 0;
BEGIN
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: super_admin required';
  END IF;

  SELECT
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0),
    COUNT(*)
  INTO v_total_revenue, v_total_refunds, v_total_tx
  FROM sales_records
  WHERE payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status = 'Concluído';

  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM organizations)::bigint,
    (SELECT COUNT(*) FROM pdvs WHERE status = 'active')::bigint,
    v_total_revenue,
    v_total_tx,
    v_total_refunds,
    CASE WHEN v_total_tx > 0 THEN v_total_revenue / v_total_tx ELSE 0 END::numeric;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_super_admin_global_metrics(timestamptz, timestamptz) TO authenticated;
```

### 2. Refactor `src/hooks/useDashboard.ts` (linhas 192–225)

Remover os 3 fetches HEAD/SELECT e o `try/catch` silencioso. Substituir por:

```ts
let globalMetrics: DashboardData["globalMetrics"] = undefined;
if (isSuperAdmin) {
  const { data, error } = await supabase.rpc("get_super_admin_global_metrics", {
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
  });
  if (!error && data?.[0]) {
    const row = data[0];
    globalMetrics = {
      totalOrganizations: Number(row.total_organizations) || 0,
      totalPdvsGlobal: Number(row.total_pdvs_global) || 0,
      totalRevenueGlobal: Number(row.total_revenue_global) || 0,
      totalTransactionsGlobal: Number(row.total_transactions_global) || 0,
      totalRefundsGlobal: Number(row.total_refunds_global) || 0,
      avgTicketGlobal: Number(row.avg_ticket_global) || 0,
    };
  }
}
```

### 3. Memória

Atualizar `mem://features/super-admin-consolidated-dashboard-metrics` registrando que métricas globais são obtidas via RPC `get_super_admin_global_metrics`, não HEAD counts.

### Validação

- Network sem HEAD em `/organizations` ou `/pdvs` no dashboard.
- Apenas um `POST /rpc/get_super_admin_global_metrics` retornando 200.
- Card "Visão Consolidada" mostra contagens reais.
- Login não-super_admin invocando a RPC manualmente recebe erro de permissão.
- `supabase--linter` sem novos warnings.

### Riscos

- Nenhuma mudança de RLS — segurança preservada via check no corpo da função.
- Mais rápido e estável que 3 fetches paralelos.
- Fallback gracioso: erro mantém `globalMetrics` undefined e o card não renderiza (mesmo comportamento atual).

### Arquivos afetados

- Nova migration em `supabase/migrations/`.
- `src/hooks/useDashboard.ts` (substituir bloco `if (isSuperAdmin)`).
- `mem://features/super-admin-consolidated-dashboard-metrics` + `mem://index.md`.