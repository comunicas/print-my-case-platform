
## Diagnóstico revisado (3 bugs encontrados, não 2)

Após inspecionar `pg_proc`, a tabela `ai_agent_tools`, `ai_tool_calls` e o `index.ts` do edge function, ficou claro que:

**Como o agente realmente funciona em produção:** as tools expostas ao LLM vêm da tabela `ai_agent_tools` (carregada dinamicamente em `loadAgentConfig`). O array `TOOLS` em `tools.ts` só é usado como *fallback* quando a tabela está vazia. O `TOOL_TO_RPC` (também em `tools.ts`) é o que importa para a execução.

### Bug 1 — RPC quebrada por parâmetro inexistente
Logs mostram dezenas de falhas:
```
Could not find the function public.ai_get_stock_overview(_limit, _pdv_ids, _product_name)
```
A RPC real é `ai_get_stock_overview(_pdv_ids uuid[], _limit integer)` — sem `_product_name`. Mas:
- `TOOL_TO_RPC.get_stock_overview.mapParams` envia `_product_name`.
- `ai_agent_tools.get_stock_overview.parameters_schema` ainda anuncia `product_name` ao LLM.

**Resultado:** toda consulta tipo "estoque do produto X" estoura erro genérico no chat.

### Bug 2 — `available_in` perde os PDVs de origem quando filtra por PDV
A coluna `available_in` da RPC `ai_get_zero_stock_items` foi feita para mostrar `"SEDE (14 un), Tietê (3 un)"`. Mas o CTE `per_pdv` aplica `_pdv_ids` em **todo o cálculo**, então o subquery que monta `available_in` nunca vê os outros PDVs. Por isso o LLM cai em texto genérico "Outros PDVs (5)".

### Bug 3 (latente) — Tools fantasma adicionadas no commit anterior
No prompt anterior adicionei `get_pdv_list` e `get_pdv_slot_inventory` em `tools.ts`, mas:
- A RPC `ai_get_pdv_slot_inventory` **não existe** no banco.
- A RPC `ai_get_pdv_list` existe (sem args), mas o registro em `ai_agent_tools` **nunca foi criado** — então o LLM nunca enxerga essas tools. Estavam só decorativas.

## Plano de correção (cirúrgico, sem quebrar nada)

### Passo 1 — Corrigir `mapParams` de `get_stock_overview`
Em `supabase/functions/ai-agent/tools.ts`, simplificar o mapping para refletir a assinatura real da RPC:
```ts
get_stock_overview: {
  rpc: "ai_get_stock_overview",
  mapParams: (p) => ({ _pdv_ids: p.pdv_ids ?? null, _limit: p.limit ?? 100 }),
},
```
(Ignora `product_name` silenciosamente — se o LLM enviar, não causa erro.)

### Passo 2 — Atualizar o schema da tool no banco (DATA UPDATE, não migration)
Via insert tool, fazer `UPDATE ai_agent_tools` em `get_stock_overview`:
- Remover `product_name` de `parameters_schema`.
- Reforçar a `description`: "Para filtrar por nome de produto, use `get_zero_stock_items` (que retorna por PDV) ou peça mais especificamente."

### Passo 3 — Migration para corrigir `available_in`
Criar nova migration que dropa e recria `ai_get_zero_stock_items` com a lógica:

```text
WITH all_pdv_stock AS (        -- todos PDVs acessíveis (sem _pdv_ids)
  SELECT product_name, pdv_id, p.name AS pdv_name,
         SUM(quantity)::bigint AS total_quantity, ...
  FROM stock_records sr JOIN pdvs p ON p.id=sr.pdv_id
  WHERE sr.is_active AND user_can_access_pdv(auth.uid(), sr.pdv_id)
  GROUP BY ...
),
per_pdv AS (                   -- aplica _pdv_ids só na linha exibida
  SELECT * FROM all_pdv_stock
  WHERE _pdv_ids IS NULL OR pdv_id = ANY(_pdv_ids)
),
network AS (                   -- rede inteira para zero_scope correto
  SELECT product_name, SUM(total_quantity) AS network_total
  FROM all_pdv_stock GROUP BY product_name
)
SELECT pp.*, n.network_total,
  GREATEST(0, n.network_total - pp.total_quantity) AS stock_in_other_pdvs,
  (SELECT STRING_AGG(format('%s (%s un)', src.pdv_name, src.total_quantity),
                     ', ' ORDER BY src.total_quantity DESC, src.pdv_name)
   FROM all_pdv_stock src
   WHERE src.product_name = pp.product_name
     AND src.pdv_id <> pp.pdv_id
     AND src.total_quantity > 0) AS available_in,
  CASE WHEN n.network_total = 0 THEN 'zero_in_network' ELSE 'zero_in_pdv_only' END
FROM per_pdv pp JOIN network n USING (product_name)
WHERE pp.total_quantity = 0
ORDER BY pp.product_name, pp.pdv_name
LIMIT _limit
```

A assinatura `(uuid[], integer)` e a tabela retornada **se mantêm** — drop + create (mesmo padrão da migration `20260502090000_*` já existente). Sem impacto no front (nenhum hook usa essas RPCs).

### Passo 4 — Remover tools fantasma
Em `tools.ts`, remover do array `TOOLS` e do `TOOL_TO_RPC`:
- `get_pdv_slot_inventory` (RPC inexistente — risco de erro futuro se alguém habilitar).
- `get_pdv_list` (não usado, não cadastrado, ainda confundindo skill.ts).

E em `skill.ts`, remover as menções a `get_pdv_list` (PDVs já vêm com nome no `available_in`, não precisamos resolver UUID na maior parte dos casos).

### Passo 5 — Reforço pequeno em `skill.ts`
Adicionar uma linha:
> Em qualquer tabela de produtos zerados, copie literalmente o conteúdo de `available_in` para a coluna "Disponível em". Nunca substitua por "Outros PDVs (N)".

## O que NÃO vou mexer (para não quebrar nada)
- Não toco no `index.ts` (lógica de tool-calling, autenticação, rate-limit, truncagem) — está funcionando.
- Não recrio `ai_get_stock_overview` (já está correta no banco, só precisa do mapParams certo).
- Não mexo em `ai_agent_tools` para `get_zero_stock_items` (schema já está ok).
- Não mexo na sobrecarga de `ai_get_purchases_summary` / `ai_get_stock_redistribution_suggestions` — funcionando, e drop poderia gerar ambiguidade.
- Não altero o threshold de `get_low_stock_alerts` aplicado anteriormente (5).
- Mantenho RLS, GRANTs, SECURITY DEFINER intactos.

## Resultado esperado
| Pergunta do usuário | Antes | Depois |
|---|---|---|
| "BOULEVARD TATUAPÉ SAMSUNG Galaxy A5 em qual pdv tem estoque?" | "Erro ao consultar" | Tabela com nome real do(s) PDV(s) e quantidade |
| Tabela de zerados com filtro de PDV | "Outros PDVs (5)" | "SEDE (14 un), Extra Ricardo Jafet (3 un)" |
| "Quanto tenho de iPhone 15?" | "Erro ao consultar" | Lista por PDV (sem filtro server-side, mas o LLM filtra na resposta) |

## Arquivos alterados
1. `supabase/functions/ai-agent/tools.ts` — mapParams corrigido; remoção de tools fantasma.
2. `supabase/functions/ai-agent/skill.ts` — remover menções a `get_pdv_list`; reforço sobre `available_in`.
3. `supabase/migrations/<timestamp>_zero_stock_available_in_global.sql` — drop + recreate da RPC.
4. `UPDATE ai_agent_tools` (via insert tool) — remover `product_name` do schema de `get_stock_overview`.
