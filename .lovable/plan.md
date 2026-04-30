
# Plano: Migrar `ai-agent` para API direta da OpenAI

## Objetivo

Trocar o provider de IA do edge function `ai-agent` do **Lovable AI Gateway** (`https://ai.gateway.lovable.dev`) para a **API oficial da OpenAI** (`https://api.openai.com`), usando a secret `OPENAI_API_KEY` fornecida por você. Tudo o mais (tools, RPCs, RAG, skill, histórico, rate-limit, telemetria) permanece igual.

## Pré-requisito (1 ação sua)

Vou solicitar a secret `OPENAI_API_KEY` via tool de secrets do Lovable Cloud. Você cola a chave (sk-...) gerada em https://platform.openai.com/api-keys → e seguimos. Sem essa chave o agente não responde.

## Mudanças

### 1. Edge Function `supabase/functions/ai-agent/index.ts`

- Trocar a leitura de secret:
  - Remover dependência obrigatória de `LOVABLE_API_KEY`.
  - Ler `OPENAI_API_KEY`. Se ausente → 500 com mensagem clara ("OpenAI não configurada").
- Trocar URL e header de auth:
  - `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions`
  - `Authorization: Bearer ${OPENAI_API_KEY}`
- Trocar identificador do modelo (gateway usa prefixo `openai/`, OpenAI direta não):
  - `openai/gpt-5-mini` → `gpt-5-mini` (constante `MODEL`).
- Manter o mesmo formato de payload (chat completions + tools) — é 100% compatível.
- Tratamento de erros HTTP da OpenAI:
  - `401` → "Chave da OpenAI inválida. Verifique OPENAI_API_KEY."
  - `429` → mensagem de rate-limit (igual hoje).
  - `402` / `insufficient_quota` (vem como 429 com `code: insufficient_quota`) → "Saldo/cota da OpenAI esgotado. Verifique billing em platform.openai.com."
  - Outros → "Falha no provedor de IA."
- Telemetria (`ai_runs`):
  - `provider: "lovable"` → `provider: "openai"`
  - `model` continua sendo gravado.
  - `input_tokens` / `output_tokens` / `cached_tokens` (de `usage.prompt_tokens_details.cached_tokens`) seguem iguais — o schema da OpenAI é idêntico.

### 2. Embeddings (RAG)

- Hoje os embeddings (`text-embedding-3-small`) estavam previstos via gateway. Vou padronizar também na OpenAI direta:
  - Endpoint: `https://api.openai.com/v1/embeddings`
  - Mesma `OPENAI_API_KEY`.
- Se ainda não houver chamada de embeddings ativa em produção (RAG ainda não povoado), apenas garanto que qualquer função futura de ingestão use o mesmo provider para consistência. **Não vou criar ingestão de RAG agora** — fica fora desse escopo (era parte v2). Apenas deixo a constante de embeddings pronta.

### 3. Documentação

- Atualizar `docs/assistente-ia.md`:
  - Provider: OpenAI direta.
  - Secret necessária: `OPENAI_API_KEY` (não mais `LOVABLE_API_KEY`).
  - Como rotacionar a chave (Lovable Cloud → Secrets).
  - Troubleshooting: 401 (chave inválida), 429 + insufficient_quota (billing), 429 normal (rate-limit OpenAI da sua conta).

### 4. O que NÃO muda

- Tabelas (`ai_conversations`, `ai_messages`, `ai_runs`, `ai_tool_calls`, `ai_knowledge_chunks`).
- RLS, roles (`org_admin` / `super_admin`).
- Tools determinísticas (RPCs SQL) e `TOOL_TO_RPC`.
- `skill.ts` (regras de negócio, formatação BRL, regra de cobertura ≥ 7 dias).
- Frontend (`/assistente`, hooks, `AgentChatPanel`, markdown).
- Rate-limit do app (20 msgs / 10 min por usuário).
- Histórico (12 últimas mensagens).

## Detalhes técnicos

### Modelo

- Default: `gpt-5-mini` (custo/latência equilibrados, suporta tool-calling).
- Caso queira trocar depois para `gpt-5` (mais capaz) ou `gpt-5-nano` (mais barato), basta mudar a constante `MODEL`. A API é a mesma.

### Compatibilidade do payload

A request atual já é OpenAI-compatible:
```json
{ "model": "...", "messages": [...], "tools": [...], "stream": false }
```
Apenas o nome do modelo e o `Authorization` mudam. Sem refactor do loop de tool-calling.

### Custos

Passa a ser cobrado **direto na sua conta OpenAI** (billing em platform.openai.com), não mais no plano Lovable. Você ganha controle total de orçamento (limites na OpenAI) mas perde o "incluso" do Lovable AI.

## Critérios de aceite

- `OPENAI_API_KEY` configurada como secret no Lovable Cloud.
- `/assistente` responde normalmente (texto + uso de tools de estoque/vendas/financeiro).
- `ai_runs.provider = 'openai'` nas novas execuções.
- Logs do edge function mostram chamadas para `api.openai.com`, não para `ai.gateway.lovable.dev`.
- Erro amigável quando a chave estiver ausente, inválida ou sem saldo.
- Frontend e UX permanecem idênticos.

## Fora de escopo

- Streaming SSE (continua não-streaming, como o MVP atual).
- Ingestão de RAG / popular `ai_knowledge_chunks` (v2).
- Trocar embeddings já indexados (não há nenhum ainda).
