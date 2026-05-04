## Objetivo

Reaplicar a Etapa 1: garantir que o RPC `ai_get_payment_breakdown` use `payment_date` (e não `order_time`) tanto no CTE `pdv_totais` quanto na query principal, para alinhar os totais do agente IA aos KPIs do dashboard.

## Mudança

Criar nova migration SQL com `CREATE OR REPLACE FUNCTION public.ai_get_payment_breakdown(...)` idêntica ao spec fornecido:

- Filtro de data: `sr.payment_date BETWEEN _start AND _end` (em ambos: CTE `pdv_totais` e SELECT principal).
- Mantém `status = 'Concluído'`, `user_can_access_pdv(auth.uid(), sr.pdv_id)` e filtro opcional `_pdv_ids`.
- Retorna: `pdv_nome`, `forma_pagamento`, `num_vendas`, `faturamento`, `pct_do_pdv` (com `ROUND` em 2 e 1 casas).
- `REVOKE EXECUTE ... FROM anon, public` e `GRANT EXECUTE ... TO authenticated`.

A operação é idempotente (`CREATE OR REPLACE`), então pode ser aplicada com segurança mesmo já tendo sido feita antes.

## Arquivo

- Nova migration em `supabase/migrations/` com o SQL acima.

## Validação

- Após apply, executar `SELECT pg_get_functiondef('public.ai_get_payment_breakdown'::regproc);` mentalmente via tool de query para confirmar `payment_date`.
- No agente: "breakdown de pagamentos últimos 30 dias" deve bater com KPI de Receita do dashboard para o mesmo período.

## Fora de escopo

- Etapas 2–6 (já aplicadas anteriormente).
