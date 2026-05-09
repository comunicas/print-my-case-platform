# Serialização robusta de erros na `ingest-revenue`

## Objetivo
Substituir o atual `err instanceof Error ? err.message : String(err)` (que produz `"[object Object]"` para `PostgrestError` e respostas da API KXZ) por uma serialização que preserve **mensagem real, código e detalhes** tanto nos logs quanto em `uploads.error_message` e `uploads.sync_summary`.

## Mudanças

### 1. Helper `serializeError` (novo, no topo da função)
Função pura que aceita `unknown` e retorna `{ message, code?, details?, hint?, raw? }`:

- `Error` → `{ message: e.message, code: e.name, details: e.stack?.slice(0, 500) }`
- Objeto com `message` (caso de `PostgrestError`: `{ message, code, details, hint }`) → preservar todos os 4 campos
- Objeto sem `message` → `JSON.stringify(e).slice(0, 1000)` como `message`, `raw` com payload truncado
- String/number/boolean → `{ message: String(e) }`
- `null`/`undefined` → `{ message: "Erro desconhecido" }`

### 2. Aplicar nos `catch`
- **Per-PDV catch** (linha ~496): usar `serializeError(err)`; gravar `error_message = info.message.slice(0, 500)` e `sync_summary = { error: info.message, code: info.code, details: info.details, hint: info.hint }`. Incluir todos os campos no `results.push` e no `console.error` (com `JSON.stringify`).
- **Catch fatal** (linha ~517): mesmo helper; resposta JSON inclui `code`/`details`.
- **Branch `createErr` do upload** (linha ~443): também serializar com helper em vez de `createErr?.message`.

### 3. Log estruturado antes do update no banco
Antes do `update` em `uploads` no catch per-PDV, adicionar:
```ts
console.error(`[ingest-revenue] pdv=${pdvName} erro detalhado:`, JSON.stringify(info));
```
Garante que mesmo se o update falhar, temos o erro real nos logs da Edge Function.

### 4. Enriquecer erros lançados internamente
- Login KXZ (linha 135, 140, 144) e listagem (207, 213) já usam `new Error(...)` — manter.
- Upsert (`if (upErr) throw upErr` linhas 378 e 467): manter o `throw upErr` (PostgrestError); o helper agora cuida da serialização.

## Não muda
- Schema do banco (colunas `error_message` text e `sync_summary` jsonb já existem).
- Frontend (`ApiSyncDialog`) — já lê `result.error` como string; continua funcionando porque `info.message` é string. Sem alterações de UI nesta task.
- Lógica de upsert, paginação KXZ ou normalizers.

## Validação
1. Reexecutar sincronização para 1 PDV via `ApiSyncDialog`.
2. Conferir `uploads.error_message` e `uploads.sync_summary` no banco — devem conter mensagem legível e, quando aplicável, `code`/`details`/`hint` do Postgres.
3. Conferir logs da Edge Function — entrada `erro detalhado:` com JSON completo.
4. Com o erro real visível, abrir task seguinte para corrigir a causa raiz (provavelmente upsert em `sales_records`).

## Arquivos tocados
- `supabase/functions/ingest-revenue/index.ts` (apenas).
