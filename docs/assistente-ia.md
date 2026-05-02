# Assistente IA Operacional — v1

Copiloto de gestão para org_admin e super_admin. Responde sobre estoque, vendas, faturamento e sugere redistribuição entre PDVs.

## Arquitetura

```
UI (/assistente) → useAiChat → edge function `ai-agent`
                                  ├─ valida JWT + role (admin)
                                  ├─ rate limit (20 msgs / 10 min / usuário)
                                  ├─ persiste user message em ai_messages
                                  ├─ monta prompt: SKILL_CORE + histórico (12) + pergunta
                                   ├─ chama OpenAI direta (gpt-5-mini) com tools
                                  ├─ loop tool-calling (até 5 iterações):
                                  │     RPCs SECURITY DEFINER no banco (RLS por auth.uid())
                                  ├─ persiste assistant message
                                  └─ grava ai_runs + ai_tool_calls (auditoria)
```

## UI / UX

- Página `/assistente` renderiza dentro de `AppLayout fullHeight` — o `<main>` fica em
  `overflow-hidden` e o painel gerencia seu próprio scroll, mantendo o `ChatInput`
  fixo no rodapé do viewport em qualquer dispositivo.
- Em md+ (≥768px) o layout é de duas colunas: histórico (`w-[280px]` / `xl:w-[320px]`)
  + chat (`flex-1`). O usuário pode colapsar o histórico via botão `PanelLeft`; o
  estado é persistido em `localStorage` (`ai-agent.sidebar-collapsed`).
- Em mobile (<768px) o histórico é acessado por um `Sheet` lateral aberto pelo botão
  `PanelLeft` no header do painel. Touch targets ≥ 44px.
- Exclusão de conversa é feita pelo ícone de lixeira na lista, com confirmação via
  `AlertDialog`. Em desktop o ícone aparece no hover; em mobile fica sempre visível.
- Auto-scroll: comportamento `smooth` quando chegam novas mensagens ou enquanto
  o assistente responde; `auto` (instantâneo) ao trocar de conversa, evitando flicker.
- A renderização markdown da resposta usa `react-markdown` + `remark-gfm` com
  `skipHtml` e lista de elementos perigosos bloqueada (`script`, `iframe`, etc.).

## Componentes do front

| Arquivo | Responsabilidade |
|---|---|
| `src/pages/Assistente.tsx` | Guard de role (`super_admin` / `org_admin`) e mount do painel em `AppLayout fullHeight`. |
| `src/components/ai-agent/AgentChatPanel.tsx` | Orquestração: estado da conversa ativa, sidebar colapsável, header, scroll. |
| `src/components/ai-agent/ConversationList.tsx` | Lista agrupada por data, botão "Novo", exclusão com `AlertDialog`. |
| `src/components/ai-agent/ChatInput.tsx` | Textarea auto-grow, envio com Enter (desktop) / Ctrl+Enter (mobile), `safe-area-inset`. |
| `src/components/ai-agent/MessageBubble.tsx` | Bubble user/assistant, markdown sanitizado. |
| `src/components/ai-agent/QuickActions.tsx` | Sugestões de prompts iniciais. |
| `src/hooks/useAiChat.ts` | `invoke('ai-agent')`, mapeia 402/403/429 para toasts, invalida queries. |
| `src/hooks/useAiConversations.ts` | Listagem e exclusão de conversas (sem renomear; ver Limitações). |
| `src/hooks/useAiMessages.ts` | Mensagens de uma conversa (filtra `user`/`assistant`). |

## Variáveis / secrets

- `OPENAI_API_KEY` — chave da API da OpenAI (https://platform.openai.com/api-keys). Configurada nas secrets do Lovable Cloud.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — já existentes.

Para rotacionar a chave: Lovable Cloud → Secrets → atualizar `OPENAI_API_KEY`. O edge function passa a usá-la na próxima chamada (sem redeploy).

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
- **402 / "Saldo/cota da OpenAI esgotado"**: adicionar saldo em https://platform.openai.com/account/billing.
- **"Chave da OpenAI inválida"**: regenerar a key em platform.openai.com e atualizar a secret `OPENAI_API_KEY`.
- **429 sem ser quota**: rate-limit da sua conta OpenAI; aguardar ou solicitar aumento de tier.
- **403**: usuário não é admin.
- **"Não consegui finalizar a análise"**: hit em `MAX_TOOL_ITERATIONS=5`. Reformular pergunta.
- **Tool retorna vazio**: verificar PDVs do usuário (`user_pdvs`) e se há dados no período.

## Limitações conhecidas

- O título de uma conversa recém-criada só aparece no header após o `invalidateQueries`
  da lista resolver (~200–500ms). Durante esse intervalo é exibido "Conversa".
- Não há UI para renomear conversa — a mutation `rename` foi removida do hook
  `useAiConversations` por estar sem consumidor. Reintroduzir junto com a tela
  quando houver demanda.
- Sem streaming de tokens: a resposta chega após o loop de tool-calling concluir.
- Sem cancelamento de requisição em andamento.

## Trocar provider

Para mudar de modelo: edite `MODEL` em `supabase/functions/ai-agent/index.ts` (`gpt-5-mini`, `gpt-5`, `gpt-5-nano`). Para voltar ao Lovable AI Gateway: trocar `OPENAI_CHAT_URL` para `https://ai.gateway.lovable.dev/v1/chat/completions`, prefixar o modelo com `openai/` e usar `LOVABLE_API_KEY`.

## Checklist de deploy

- [x] Migration aplicada (tabelas, RPCs, RLS).
- [x] `OPENAI_API_KEY` configurada nas secrets.
- [x] `ai-agent` registrada com `verify_jwt = true`.
- [x] Item "Assistente IA" no AppSidebar e MobileSidebar (admins only).
- [x] Rota `/assistente` protegida.
- [x] UI responsiva (mobile / tablet / desktop) com sidebar colapsável.
- [x] `ChatInput` fixo no rodapé via `AppLayout fullHeight`.
- [x] Exclusão de conversa com confirmação (`AlertDialog`).


## Checklist operacional

### 1) Formato obrigatório de saída para análises tabulares

- [ ] Sempre responder análises com dados estruturados em tabela Markdown quando houver comparação entre itens, PDVs, períodos ou status.
- [ ] Incluir cabeçalho mínimo por linha: **item**, **PDV**, **métrica principal**, **status/recomendação**.
- [ ] Quando houver totais, adicionar linha de **Total** no fim da tabela.
- [ ] Evitar texto corrido para resultados numéricos que possam ser tabulados.

### 2) Continuidade entre turnos para referências tipo “itens acima”

- [ ] Tratar referências anafóricas (ex.: “itens acima”, “esses produtos”, “os mesmos PDVs”) como continuação direta do contexto da conversa ativa.
- [ ] Reusar explicitamente os mesmos itens citados no turno anterior antes de expandir a análise.
- [ ] Se houver ambiguidade real (ex.: duas listas diferentes no contexto recente), desambiguar citando as opções de forma objetiva na própria resposta.

### 3) Regra de não expor erro técnico de tool ao usuário

- [ ] Nunca exibir stack trace, nome interno de função, payload bruto de tool, erro SQL, timeout interno ou detalhes de infraestrutura.
- [ ] Converter falha técnica em mensagem funcional e acionável para usuário final (ex.: indisponibilidade temporária, falta de dados no período, necessidade de refinar filtro).
- [ ] Registrar detalhe técnico apenas em observabilidade (`ai_runs`/`ai_tool_calls`), mantendo a resposta final limpa.

### 4) Obrigatoriedade de separar recomendação por tipo

- [ ] Toda recomendação operacional deve ser agrupada em blocos separados e nomeados exatamente como:
  - **transferir**
  - **aguardar compra**
  - **comprar**
- [ ] Não mesclar categorias no mesmo bloco.
- [ ] Se uma categoria não tiver itens, retornar explicitamente “sem itens” naquela categoria para manter consistência do formato.

### 5) Critério de aceite visual no `/assistente` (desktop e mobile) para mensagens de estoque/PDV

- [ ] Em desktop (≥768px), tabelas e blocos de recomendação devem ficar legíveis sem sobreposição com header fixo, input fixo ou sidebar.
- [ ] Em mobile (<768px), conteúdo deve quebrar linha corretamente, sem overflow horizontal persistente e sem cortar colunas essenciais de estoque/PDV.
- [ ] Mensagens com tabela devem manter contraste, espaçamento e hierarquia visual entre cabeçalho, linhas e blocos de recomendação.
- [ ] O usuário deve conseguir ler início, meio e fim da análise com scroll contínuo do chat, mantendo o campo de entrada acessível no rodapé.
