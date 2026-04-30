# Assistente IA Operacional — v1

Copiloto de gestão para org_admin e super_admin. Responde sobre estoque, vendas, faturamento e sugere redistribuição entre PDVs.

## Arquitetura

```
UI (/assistente) → useAiChat → edge function `ai-agent`
                                  ├─ valida JWT + role (admin)
                                  ├─ rate limit (20 msgs / 10 min / usuário)
                                  ├─ persiste user message em ai_messages
                                  ├─ monta prompt: SKILL_CORE + histórico (12) + pergunta
                                  ├─ chama Lovable AI (openai/gpt-5-mini) com tools
                                  ├─ loop tool-calling (até 5 iterações):
                                  │     RPCs SECURITY DEFINER no banco (RLS por auth.uid())
                                  ├─ persiste assistant message
                                  └─ grava ai_runs + ai_tool_calls (auditoria)
```

## Variáveis / secrets

- `LOVABLE_API_KEY` — provisionada automaticamente pelo Lovable AI Gateway.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — já existentes.

## RPCs disponíveis (todas SECURITY DEFINER + auth.uid())

| RPC | Uso |
|---|---|
| `ai_get_stock_overview` | Estoque agregado por produto×PDV |
| `ai_get_stock_redistribution_suggestions` | Sugere transferências (cobertura < 7d destino, > 7d origem) |
| `ai_get_sales_summary` | Faturamento, ticket médio (apenas Concluído) |
| `ai_get_top_products` | Top vendidos no período |
| `ai_get_low_stock_alerts` | Estoque baixo com demanda > 0 |
| `ai_get_pdv_comparison` | Comparativo entre PDVs |
| `ai_get_purchases_summary` | Pré-estoque pendente |
| `ai_get_financial_summary` | DRE simplificado |
| `ai_match_knowledge` | Busca semântica em ai_knowledge_chunks |

Todas com `EXECUTE` revogado de `anon/public` e concedido apenas a `authenticated`.

## Segurança

- Edge function `ai-agent` com `verify_jwt = true`.
- RPCs ignoram parâmetros de identidade — usam `auth.uid()` internamente.
- Cliente que chama RPC dentro da edge function usa o JWT do usuário, então RLS é aplicada normalmente.
- `viewer` e `operator` recebem 403.
- Tabelas `ai_*` com RLS por user_id / organization_id.

## Observabilidade

- `ai_runs`: provider, modelo, input/output/cached tokens, duração, status, erro.
- `ai_tool_calls`: por tool — params, linhas retornadas, duração, status.
- Logs estruturados (JSON) com `request_id`, `user_id`, `event`.
- Header `x-request-id` em toda resposta.

## Knowledge base (RAG)

v1 entrega skill_core estática inline em `supabase/functions/ai-agent/skill.ts`. A tabela `ai_knowledge_chunks` + RPC `ai_match_knowledge` está pronta — basta popular via insert manual ou script futuro para ativar RAG.

## Troubleshooting

- **429 do front**: usuário enviou >20 msgs/10min. Aguardar.
- **402**: créditos esgotados — adicionar em Settings → Workspace → Usage.
- **403**: usuário não é admin.
- **"Não consegui finalizar a análise"**: hit em `MAX_TOOL_ITERATIONS=5`. Reformular pergunta.
- **Tool retorna vazio**: verificar PDVs do usuário (`user_pdvs`) e se há dados no período.

## Trocar provider

Editar a constante `MODEL` em `supabase/functions/ai-agent/index.ts` e ajustar URL/headers se sair do Lovable AI Gateway.

## Checklist de deploy

- [x] Migration aplicada (tabelas, RPCs, RLS).
- [x] `LOVABLE_API_KEY` provisionado.
- [x] `ai-agent` registrada com `verify_jwt = true`.
- [x] Item "Assistente IA" no AppSidebar e MobileSidebar (admins only).
- [x] Rota `/assistente` protegida.
