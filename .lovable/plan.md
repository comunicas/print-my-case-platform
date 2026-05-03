
## Resumo da verificação

Rodei contra o banco real e contra o código:

| Audit alegou | Realidade | Conclusão |
|---|---|---|
| `pre_stock.allocated_pdv_id` não existe | Coluna existe (`\d pre_stock`) | Audit errado |
| `sales_records.refund_amount` / `discount_amount` não existem | Ambas existem | Audit errado |
| `ai_get_pre_stock_detail` crasha | `SELECT * FROM ai_get_pre_stock_detail(NULL,5)` retorna sem erro | Audit errado |
| `ai_get_financial_summary_by_pdv` crasha | Executa sem erro (0 linhas) | Audit errado |
| Novas tools podem não estar em `ai_agent_tools` | DB tem 10 tools; **faltam 9** das 19 esperadas | **Root cause real** |
| `get_stock_overview` virou `slots jsonb` pesado | Verdadeiro; risco de payload grande em paralelo | Mitigação útil |
| SKILL_CORE não prioriza SEDE | Já implementado em correção anterior | Já feito |

**Diagnóstico:** o motivo de "Otimizar estoque", "DRE", "Comparar PDVs" caírem em fallback genérico não é SQL quebrado — é que as 9 tools novas (`get_pre_stock_detail`, `get_financial_summary_by_pdv`, `get_financial_entries`, `get_payment_breakdown`, `get_sales_timeline`, `get_product_catalog`, `get_pending_allocations`, `get_upload_status`, `get_pdv_list`) **não estão registradas em `ai_agent_tools`**. O `index.ts` (linha 88) usa o DB como fonte de verdade quando há ≥1 linha — então o modelo recebe apenas as 10 tools antigas e nem enxerga as novas, mesmo que existam em `tools.ts` e como RPC no Postgres.

---

## Plano dividido em 4 etapas pequenas e independentes

Cada etapa é deployável e testável isoladamente. Ordem recomendada: 1 → 2 → 3 → 4.

### Etapa 1 — Registrar as 9 tools faltantes em `ai_agent_tools` (FIX PRINCIPAL)

**Objetivo:** desbloquear DRE, Otimizar estoque, e qualquer fluxo que dependa das tools novas.

**Ação:** uma migration SQL nova com 9 INSERTs idempotentes (`ON CONFLICT (name) DO UPDATE`). Cada INSERT espelha exatamente a definição em `supabase/functions/ai-agent/tools.ts` (já verificado):

| name | handler_name (RPC) | parameters_schema (resumido) |
|---|---|---|
| `get_pdv_list` | `ai_get_pdv_list` | `{}` |
| `get_pre_stock_detail` | `ai_get_pre_stock_detail` | `status?: string`, `limit?: int` |
| `get_financial_summary_by_pdv` | `ai_get_financial_summary_by_pdv` | `start, end` (required) |
| `get_financial_entries` | `ai_get_financial_entries` | `reference_month?, pdv_ids?, limit?` |
| `get_payment_breakdown` | `ai_get_payment_breakdown` | `start, end` (required), `pdv_ids?` |
| `get_sales_timeline` | `ai_get_sales_timeline` | `start, end` (req), `granularity?, pdv_ids?` |
| `get_product_catalog` | `ai_get_product_catalog` | `category?, limit?` |
| `get_pending_allocations` | `ai_get_pending_allocations` | `status?, limit?` |
| `get_upload_status` | `ai_get_upload_status` | `{}` |

`enabled=true`, `category` agrupada (`stock`, `financial`, `sales`, `meta`), `display_order` 11..19, `description` copiada literalmente de `tools.ts` (mantém consistência semântica para o modelo).

**Validação:** após apply, `SELECT count(*) FROM ai_agent_tools` = 19. Aguardar 60s (TTL de cache do edge function) ou aguardar próxima invocação após esse intervalo. Testar botão "DRE do mês" — deve aparecer chamada a `get_financial_summary_by_pdv` em `ai_tool_calls`.

---

### Etapa 2 — Aliviar payload de "Comparar PDVs"

**Objetivo:** eliminar o risco de context_length_exceeded quando `get_stock_overview` (que agora retorna `slots jsonb` pesado) roda em paralelo com `get_pdv_comparison`.

**Ação:** editar `src/components/ai-agent/QuickActions.tsx`, botão "Comparar PDVs". Substituir `get_stock_overview` por `get_low_stock_alerts(threshold=3)`:

- Seção 1 — Desempenho de vendas: `PDV | Faturamento | Transações | Ticket médio | % do total` (de `get_pdv_comparison`)
- Seção 2 — Risco de estoque: `PDV | Produto | Qtd atual | Status` com 🔴 Zerado / 🟠 1-2 un / 🟡 3 un. Se PDV sem alertas: "Estoque saudável."
- Encerrar destacando PDV de melhor faturamento e maior risco.

Preservar ícone, label, ordem dos demais botões e estrutura do componente.

**Validação:** clicar "Comparar PDVs" em `/assistente` → resposta com 2 seções, sem erro genérico.

---

### Etapa 3 — Tolerância a falha no fluxo DRE do SKILL_CORE

**Objetivo:** garantir que, mesmo se uma das 3 tools de finanças falhar pontualmente (timeout, RLS, etc.), o DRE consolidado sempre saia.

**Ação:** em `supabase/functions/ai-agent/skill.ts`, na sub-seção "### DRE do mês":

- `get_financial_summary` permanece **obrigatória** (sem ela não há DRE).
- `get_financial_summary_by_pdv` e `get_financial_entries` ficam marcadas como **opcionais**: "se o resultado da tool indicar erro, **omita a seção correspondente** e prossiga com as demais — não devolva mensagem de erro ao usuário".

Demais regras (formato de tabelas, negrito em Receita líquida e Resultado) preservadas.

**Validação:** após Etapa 1 + Etapa 3, "DRE do mês" entrega DRE Consolidado mesmo se as 2 tools auxiliares estiverem indisponíveis. Cache de SKILL_CORE leva até 60s.

---

### Etapa 4 — Verificação pós-deploy (sem código)

Checklist executado contra produção:

1. `SELECT name, enabled FROM ai_agent_tools ORDER BY display_order` → 19 linhas, todas `enabled=true`.
2. Botão "DRE do mês" → `ai_tool_calls` mostra `get_financial_summary` (+ `get_financial_summary_by_pdv` e `get_financial_entries` quando há dados).
3. Botão "Otimizar estoque entre PDVs" → `ai_tool_calls` mostra `get_pre_stock_detail` (status='available').
4. Botão "Comparar PDVs" → não aparece mais `get_stock_overview` nas tool_calls; aparece `get_low_stock_alerts`.
5. Texto livre "DRE" → mesmo comportamento do botão.

Se algo falhar, inspecionar `supabase--edge_function_logs ai-agent`.

---

## O que **não** será feito (e por quê)

- **Não recriar** `ai_get_pre_stock_detail` nem `ai_get_financial_summary_by_pdv`. Audit identificou colunas erradas como inexistentes — verificação direta confirma que existem e as funções rodam.
- **Não alterar** `index.ts` — toda a lógica de retry/timeout/loop foi refatorada nas etapas 1-3 anteriores e está estável.
- **Não tocar** na seção "Política de redistribuição" do SKILL_CORE — prioridade SEDE já está implementada via prompt do botão "Otimizar estoque".

## Detalhes técnicos

- A migration da Etapa 1 deve usar `ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description, parameters_schema=EXCLUDED.parameters_schema, handler_name=EXCLUDED.handler_name, enabled=true` para ser segura em re-runs e atualizar metadados se já houver registro parcial.
- Cache de tools no edge function: `CONFIG_CACHE_TTL = 60s`. Não precisa redeploy do edge function após a migration.
- Etapa 2 e Etapa 3 são puramente front/skill — nenhuma migration.
