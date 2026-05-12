## Objetivo
Exibir progresso por PDV e por etapa (Login → Canais → Produtos → Gravação) durante a sincronização de estoque via API Kexiaozhan.

## Abordagem
Streaming SSE a partir da edge function `sync-stock`. O front consome eventos e atualiza o estado de cada PDV em tempo real. Mantém o retorno JSON atual como fallback (retro-compatível via flag `stream`).

```text
Client ──POST sync-stock {stream:true}──▶ Edge
   ◀── event: stage  {pdv_id, stage:"login",    status:"start|done|cached"}
   ◀── event: stage  {pdv_id, stage:"channels", status:"start|progress|done", page?, count?, total?}
   ◀── event: stage  {pdv_id, stage:"products", status:"start|skip|done"}
   ◀── event: stage  {pdv_id, stage:"writing",  status:"start|done", inserted?}
   ◀── event: pdv    {pdv_id, ...PdvResult}
   ◀── event: end    {results:[...]}
```

## Backend — supabase/functions/sync-stock/index.ts
1. Aceitar `stream: true` no body. Quando ativo, responder `text/event-stream` via `ReadableStream`; senão, manter retorno JSON atual.
2. Helper `emit(event, data)` que escreve `event: X\ndata: {...}\n\n` no controller.
3. Login: emitir `start` antes de `kxzLogin()` no 1º PDV, `cached` nos seguintes, `done` após.
4. Canais: emitir `start`; dentro do loop de paginação emitir `progress {page, count}`; `done {total}` ao final.
5. Produtos: emitir `start` ou `skip` (quando nenhum nome ausente); `done` após `kxzListGoodsBriefs`.
6. Gravação: emitir `start` antes do DELETE+INSERT/recalc/buildVerification; `done {inserted}` ao final.
7. `emit("pdv", PdvResult)` por PDV concluído; `emit("end",{results})` no fim.
8. Erro por PDV: emitir `stage {status:"error", message}` + `pdv {status:"error"}` e seguir para o próximo.
9. Heartbeat `: ping\n\n` a cada 15s para evitar timeout de proxy.

## Frontend — src/components/upload/ApiStockSyncDialog.tsx
1. Novo estado `Map<pdvId, PdvProgress>` com `{ stage, stageStatus, channelsLoaded?, page? }`.
2. Trocar `supabase.functions.invoke` por `fetch` direto (`${VITE_SUPABASE_URL}/functions/v1/sync-stock`) com `Authorization` da sessão e body `{ pdv_ids, stream:true }`. Ler `response.body` com `TextDecoderStream` + parser SSE simples (split por `\n\n`).
3. Ao receber `stage`, atualizar progress do PDV; ao receber `pdv`, mesclar em `results` (mantendo UI de verificação atual); em `end`, disparar toasts + `invalidateQueries` (igual hoje).
4. UI por linha de PDV:
   - Badge da etapa atual: Login / Canais / Produtos / Gravação / OK / Erro.
   - `<Progress>` (shadcn já existente) com valor 25/50/75/100 conforme etapa concluída.
   - Subtexto opcional: "Canais: página N · X carregados".

## Considerações técnicas
- SSE via `fetch` streaming (não `EventSource`, que não suporta POST + headers).
- Sem mudanças em banco, RLS, schemas ou outras funções.
- Ordem de etapas determinística no backend; front nunca avança etapa sozinho.
- Mantém todo o comportamento atual de snapshot, recálculo de marca, dedução de pre_stock e verificação.

## Arquivos
- Editar: `supabase/functions/sync-stock/index.ts` (modo stream + emissão de eventos).
- Editar: `src/components/upload/ApiStockSyncDialog.tsx` (consumo SSE + UI de progresso por PDV/etapa).