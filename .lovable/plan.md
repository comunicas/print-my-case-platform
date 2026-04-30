## Plano final aprovado — Assistente IA Operacional v1

Arquitetura híbrida: **RPCs SQL determinísticas** para dados vivos (estoque/vendas/financeiro/redistribuição), **embeddings + skill.md** para conhecimento estável, **`gpt-5-mini` via Lovable AI** com wrapper para troca futura. Observabilidade e documentação como entregáveis obrigatórios da v1.

## Backend

### 1. Migration

**Tabelas de chat (RLS por user/org/super_admin; viewer/operator sem acesso):**

- `ai_conversations` — `id`, `user_id`, `organization_id`, `title`, `created_at`, `updated_at`, `last_message_at`. Índices: `user_id`, `organization_id`, `last_message_at desc`.
- `ai_messages` — `id`, `conversation_id`, `role` (`user|assistant|tool|system`), `content`, `tool_calls jsonb`, `tool_results jsonb`, `status text` (`ok|aborted|failed`), `created_at`.

**Auditoria/observabilidade:**

- `ai_runs` — `id`, `request_id`, `conversation_id`, `message_id`, `user_id`, `organization_id`, `provider`, `model`, `input_tokens`, `output_tokens`, `cached_tokens`, `duration_ms`, `status` (`ok|error|aborted|rate_limited`), `error_type`, `error_message`, `created_at`.
- `ai_tool_calls` — `id`, `run_id`, `request_id`, `tool_name`, `params_sanitized jsonb`, `rows_returned int`, `duration_ms int`, `status text`, `error_message`, `created_at`. Índice `(run_id, created_at)`.

**Knowledge + embeddings:**

- Habilitar extensão `vector`.
- `ai_knowledge_chunks` — `id`, `source` (`skill|manual|glossary|aliases|faq`), `title`, `content`, `embedding vector(1536)`, `metadata jsonb`, `organization_id uuid null` (NULL = global), `created_at`, `updated_at`. Índice `(source, organization_id)`.
- **Sem índice IVFFlat no início** — usar busca exata `<=>` enquanto o volume é pequeno; criar HNSW depois quando crescer (anotado no doc de operação).
- RPC `ai_match_knowledge(_query_embedding vector, _match_count int default 5, _threshold float default 0.7)` — usa `auth.uid()` internamente para filtrar por org/global.

RLS knowledge: SELECT global ou da org; INSERT/UPDATE/DELETE só super_admin (global) ou org_admin (própria org).

### 2. RPCs determinísticas (todas SECURITY DEFINER + `SET search_path = public`)

**Regra obrigatória de segurança:** todas as RPCs usam `auth.uid()` internamente — não confiam em `_user_id` recebido. PDVs permitidos resolvidos server-side via `user_can_access_pdv`.

Tools:

- `ai_get_stock_overview(_pdv_ids uuid[] default null, _limit int default 100)`
- `ai_get_stock_redistribution_suggestions(_min_coverage_days int default 7, _limit int default 20)`
- `ai_get_sales_summary(_start, _end, _pdv_ids uuid[] default null)` — só `Concluído`
- `ai_get_top_products(_start, _end, _pdv_ids uuid[] default null, _limit int default 10)`
- `ai_get_low_stock_alerts(_threshold int default 2, _limit int default 50)` — exclui produtos estagnados
- `ai_get_pdv_comparison(_start, _end)`
- `ai_get_purchases_summary(_start default null, _end default null, _limit int default 50)` — pré-estoque pendente
- `ai_get_financial_summary(_start, _end)` — DRE simplificado

**Limites de payload:** todo retorno tem `_limit` default + período máximo default (90 dias) + campos resumidos (sem IDs internos quando nome basta).

### 3. Lógica de redistribuição

```text
para cada produto presente em ≥2 PDVs da org:
  para cada PDV (origem):
     vendas_30d  = SUM(sales_records.Concluído últimos 30d)
     media_dia   = vendas_30d / 30
     cobertura   = stock_atual / max(media_dia, 0.1)
     min_origem  = ceil(media_dia * 7)
     excedente   = max(stock_atual - min_origem, 0)
     se excedente == 0: pula
     para cada PDV destino (≠ origem):
        se cobertura_destino < 7d E demanda_destino > 0:
           qtd_sugerida = min(excedente, ceil(media_destino*14) - stock_destino)
           prioridade   = high  (cobertura<3) | med (<5) | low
ordena por prioridade desc, cobertura_destino asc → top 20
```

Nunca sugere movimento que deixe origem com cobertura < 7 dias.

### 4. Edge Functions

**Registrar em `supabase/config.toml`:**
- `[functions.ai-agent]` `verify_jwt = true`
- `[functions.ai-embed]` `verify_jwt = true` + checagem de role admin no código (uso interno)

**`supabase/functions/ai-agent/index.ts`:**

- Valida JWT via `getClaims()`.
- Resolve role + org + PDVs permitidos. Bloqueia `viewer`/`operator` (403).
- Gera `request_id` (uuid) — propagado em logs, SSE headers e `ai_runs`/`ai_tool_calls`.
- Rate limit: **20 mensagens / 10 min / usuário** (conta `ai_messages` recentes).
- Recebe `{ conversationId?, message, pdv_scope: 'all'|'active_pdv'|uuid[] }`.
- Cria conversa se necessário; insere `ai_messages` (role=user).
- **Pipeline RAG**:
  1. Embedding da pergunta (`text-embedding-3-small`).
  2. `ai_match_knowledge` → top 5 chunks (threshold 0.7).
  3. Monta prompt em ordem **estática → dinâmica** para maximizar prompt caching:
     - System prompt curto (estático, cacheável)
     - **Skill core curto** (estático, cacheável) — extraído do `assistant-skill.md`, sem exemplos longos
     - Tools schemas (estático, cacheável)
     - Chunks recuperados (dinâmico, pequeno)
     - Últimas 12 mensagens
     - Pergunta atual
- Wrapper `callProvider({messages, tools, stream})`: `lovable` default; assinatura idêntica para `openai` futuro.
- Loop tool-calling: executa RPCs (RLS aplica via JWT do usuário); cada chamada registra `ai_tool_calls` com `tool_name`, `params_sanitized`, `rows_returned`, `duration_ms`, `status`.
- **Streaming SSE** com `X-Request-Id` no header e em comentários SSE.
- Suporte a `AbortController`: `req.signal.aborted` → persiste mensagem parcial com `status='aborted'` e marca run.
- Falha de stream: persiste o que tem com `status='failed'` + `error_type`.
- Persiste msg final + `ai_runs` (provider, modelo, tokens incl. `cached_tokens`, duração, status).
- Após 1ª resposta: gera título curto em background.
- Trata 429/402 do provider com `error_type` específico e mensagens claras ao cliente.
- Logs estruturados: `request_id`, `conversation_id`, `user_id`, `organization_id`, `model`, `tool_name`, `error_type` — todos via helpers de observabilidade existentes, com mascaramento.

**`supabase/functions/ai-embed/index.ts`:**

- Interno; JWT obrigatório; só admins.
- POST `{ text }` → embedding via Lovable AI Gateway.
- **Fallback**: se Lovable AI não suportar embeddings, usa OpenAI direta com `OPENAI_API_KEY` (secret separado, adicionado via add_secret quando confirmado). O wrapper é o único ponto que muda.

### 5. Knowledge base

Criar `supabase/functions/ai-agent/knowledge/assistant-skill.md` com seções:

- **Skill core** (curto, sempre enviado): papel, tom, regras de segurança, formato de resposta.
- **Glossário** (chunks): PDV, slot, pré-estoque, ruptura, cobertura, DRE, ticket médio.
- **Aliases de produtos**.
- **Como interpretar estoque/vendas/DRE** (status canônicos: só `Concluído`).
- **Política de redistribuição**.
- **Exemplos** (chunks separados — só entram no prompt via RAG quando relevantes).
- **Limites**: nunca inventar números, sempre tool, nunca expor outra org.

Script `seed-knowledge.ts` (chamado uma vez via `curl_edge_functions`): chunking ~500 tokens overlap 50, embeddings, upsert idempotente (`source='skill' AND organization_id IS NULL`).

## Frontend

### 6. Hooks

- `useAiConversations()` — list/create/rename/delete.
- `useAiMessages(conversationId)` — histórico paginado.
- `useAiChat(conversationId)` — `send(text, pdvScope)`, `stop()` (AbortController), `isStreaming`/`error`/`currentText`/`requestId`.

### 7. Componentes (`src/components/ai-agent/`)

- `AgentChatPanel` — 2 colunas desktop / drawer mobile.
- `ConversationList` — agrupado **Hoje / Ontem / Últimos 7 dias / Mais antigas**, busca, renomear, excluir, **Nova conversa** sticky.
- `ChatMessages` — auto-stick, render markdown.
- `MessageBubble` — chip de tool com ícone Lucide `Database`/`Search` (sem emoji): "Consultando estoque…". Mensagens com `status='aborted'/'failed'` exibem badge discreto.
- `ChatInput` — Textarea autosize, Enter envia / Shift+Enter quebra, botão **Enviar**↔**Parar**, ≥44px touch.
- `QuickActions` (estado vazio): otimizar estoque entre PDVs, resumo 30d, ruptura, top 10, comparar PDVs, faturamento do mês.
- `PdvScopeSelector` — **estado próprio** (não depende de `StockFiltersContext`); default = "Todos os PDVs". Lista PDVs do usuário via `useUserAllowedPDVs`.

### 8. Markdown seguro

- `react-markdown` + `remark-gfm`.
- `skipHtml` + `disallowedElements` para bloquear `<script>`/`<iframe>`.
- Tabelas com classes Tailwind do projeto.

### 9. Página e navegação

- `src/pages/Assistente.tsx` em `/assistente` (protegida, dentro de `AppLayout`).
- Lazy import + rota em `src/App.tsx`.
- Item **"Assistente IA"** (ícone `Sparkles`) em `AppSidebar` **e** `MobileSidebar`, logo após Dashboard. Visível só para `org_admin`/`super_admin`.

## Segurança e custos

- Provider default: `openai/gpt-5-mini`. Embeddings: `text-embedding-3-small`.
- Rate limit: 20/10min/usuário.
- Histórico enviado: últimas 12 mensagens.
- Skill core curto + RAG top 3-5 (não duplicar).
- RPCs nunca confiam em `_user_id` — sempre `auth.uid()`.
- Edge functions com `verify_jwt = true` no config.toml.
- Tools com limites de payload e período máximo.
- Logs sanitizados (sem email/telefone/IDs internos).

## Observabilidade (entregável obrigatório da v1)

- `ai_runs` + `ai_tool_calls` populadas em todas as execuções.
- `request_id` em todos os logs, headers SSE e tabelas.
- Logs estruturados com campos chave.
- Mensagens parciais persistidas em abort/falha (não perder contexto).

## Documentação (entregável obrigatório da v1)

Criar `docs/assistente-ia.md` cobrindo:

- Arquitetura (diagrama do pipeline RAG + tool-calling).
- Variáveis/secrets necessários (`LOVABLE_API_KEY`; opcional `OPENAI_API_KEY` para fallback de embeddings).
- Como reseedar knowledge (`curl_edge_functions` no `seed-knowledge`).
- Como trocar provider (alterar wrapper `callProvider`).
- Lista de RPCs disponíveis e contratos.
- Política de segurança (RLS, JWT, escopo de PDV).
- Troubleshooting (429/402/500, abort, busca semântica fraca, prompt caching).
- Checklist de deploy.

## Testes

- **RLS**: usuário A não vê conversas/knowledge da org B; org_admin só própria org; super_admin tudo.
- **Edge Function**: sem JWT → 401; viewer/operator → 403; rate limit → 429.
- **RPCs**: ignoram `_user_id` falsificado, usam `auth.uid()`; cross-org bloqueado; respeitam `_limit`.
- **Redistribuição**: não sugere origem que ficaria <7d; prioriza destinos críticos com demanda.
- **Frontend**: criar/enviar/streaming/**parar** (abort persiste parcial)/recarregar/renomear/excluir.
- **Markdown**: tabelas renderizam; `<script>` bloqueado.
- **Caching**: 2ª pergunta na conversa apresenta `cached_tokens > 0` em `ai_runs`.
- **Observabilidade**: `ai_tool_calls` populada com `params_sanitized`, `rows_returned`, `duration_ms`.

## Decisões assumidas

- Provider: **Lovable AI** com wrapper.
- Acesso MVP: **org_admin + super_admin**.
- Sem FAB global, sem realtime no MVP.
- 8 tools via RPC determinística.
- Knowledge: `assistant-skill.md` global, seedável.
- Embeddings via pgvector com busca exata inicial; índice HNSW quando crescer.
- Fallback de embeddings via OpenAI direta se Lovable AI não suportar (confirmo na implementação).

## Arquivos

**Criados:**
- 1 migration (chat tables + auditoria + pgvector + knowledge + 8 RPCs + `ai_match_knowledge`)
- `supabase/functions/ai-agent/index.ts`
- `supabase/functions/ai-agent/knowledge/assistant-skill.md`
- `supabase/functions/ai-agent/seed-knowledge.ts`
- `supabase/functions/ai-embed/index.ts`
- `src/pages/Assistente.tsx`
- `src/hooks/useAiConversations.ts`, `useAiMessages.ts`, `useAiChat.ts`
- `src/components/ai-agent/{AgentChatPanel,ConversationList,ChatMessages,MessageBubble,ChatInput,QuickActions,PdvScopeSelector}.tsx`
- `docs/assistente-ia.md`

**Editados:**
- `src/App.tsx` (lazy + rota)
- `src/components/layout/AppSidebar.tsx` (item de menu)
- `src/components/layout/MobileSidebar.tsx` (item de menu)
- `supabase/config.toml` (registro das duas functions com `verify_jwt = true`)
- `package.json` (`react-markdown`, `remark-gfm`)

Aprovando este plano, sigo direto para implementação seguindo a ordem: migration → RPCs → edge functions + skill → frontend → seed → docs → testes.
