## Resumo

Adicionar em `/uploads` um botão **Atualizar via API** que abre um modal para escolher mês e PDVs, busca pedidos da API Kexiaozhan e popula a estrutura ativa: `uploads` + `sales_records` (com `source='api'`). v1 sem n8n; tudo dentro do app via Supabase Edge Function. Agendamento automático fica como fase 2.

## Revisão exploratória do plano original

Após inspecionar a base e o código, três pontos do plano anterior precisam mudar:

1. **`sales_records.source` já existe** com valores `'manual'`, `'spreadsheet'` e **já existe um UNIQUE INDEX parcial** `(order_number, pdv_id) WHERE source='api'`. Alguém já preparou o esquema para ingestão via API. Isso elimina a necessidade da RPC transacional `replace_api_sales_records` proposta — basta um `upsert` com `onConflict: 'order_number,pdv_id'` filtrando por `source='api'`. Atualizações idempotentes ficam triviais e seguras, sem tocar em registros manuais ou de planilha.

2. **Já existe a Edge Function stub `ingest-revenue`** (retorna 501 + feature flag `INGEST_REVENUE_ENABLED`). Em vez de criar `sync-kex-orders`, devemos **implementar `ingest-revenue`** preservando a flag e o `request_id` que já usa. Mantém consistência com a infra existente e com o `.env` (`VITE_FEATURE_INGEST_REVENUE_ENABLED`).

3. **Reaproveitar normalizadores do `process-spreadsheet`** (`normalizeStatus`, `normalizePaymentMethod`, `parseAmount`, `sanitizeOrderNumber`) por **cópia inline** na nova função (Edge Functions não compartilham módulos do `src/`). Isso garante que vendas via API caiam nos mesmos status canônicos ('Concluído', 'Cancelado', 'Pendente', 'Reembolsado') e métodos canônicos exigidos pelos KPIs/financeiro.

## Implementação

### 1. Banco (migration única)
- `uploads`: adicionar `source text not null default 'manual'`, `sync_started_at timestamptz`, `sync_finished_at timestamptz`, `sync_summary jsonb`.
- `uploads`: índice único parcial `(pdv_id, type, period) WHERE source='api'` para garantir um único card ativo por PDV/mês.
- Backfill: `UPDATE uploads SET source='spreadsheet'` para registros existentes (mantém compat).
- Não criar RPC nova — o upsert do edge function basta.

### 2. Secrets
Pedir ao usuário via `add_secret`: `KXZ_USER`, `KXZ_PASS`, `KXZ_API_BASE`.

### 3. Edge Function `ingest-revenue` (substituir o stub)
- Manter `verify_jwt = false` apenas se chamada por scheduler; para v1 mudar para `verify_jwt = true` no `config.toml` (acionada pelo usuário logado).
- Body: `{ period: 'YYYY-MM', pdv_ids?: string[] }`.
- Validar JWT, pegar `organization_id` do usuário, listar `pdvs` ativos da org filtrados por `pdv_ids`.
- Para cada PDV:
  - `upsert` em `uploads` por `(pdv_id, type='sales', period, source='api')` com `status='processing'`, `sync_started_at=now()`, `file_name='API Kexiaozhan - <PDV> - <period>'`.
  - Login em `KXZ_API_BASE/user/login` (cache de token entre PDVs do mesmo run).
  - Paginar `/v1/orders` com `machineId=pdv.machine_id`, mês, `type=1`.
  - Mapear linhas usando os mesmos normalizadores canônicos do `process-spreadsheet`.
  - `upsert` em `sales_records` com `onConflict: 'order_number,pdv_id'` (usa o índice parcial existente), todos com `source='api'` e `upload_id` apontando ao card.
  - Atualizar `uploads`: `status='ready'`, `records_count`, `sync_finished_at`, `sync_summary={inserted, updated, skipped}`.
  - Em erro: `status='error'`, `error_message`, registrar no `sync_summary`. Continuar para os próximos PDVs (sucesso parcial).
- Resposta: `{ ok: true, results: [{pdv_id, status, count, error?}] }`.
- Manter feature flag `INGEST_REVENUE_ENABLED` como kill-switch operacional.

### 4. UI em `src/pages/Uploads.tsx`
- Ao lado do botão **Novo Upload**, adicionar **Atualizar via API** (mesmo guard `canUpload`, escondido para viewer).
- Novo componente `ApiSyncDialog`:
  - Seletor de mês (default: mês atual).
  - Multi-select de PDVs ativos (default: todos).
  - Botão **Sincronizar** dispara `supabase.functions.invoke('ingest-revenue', { body })`.
  - Lista de status por PDV durante a execução: pendente / processando / concluído / erro.
- Após resposta, invalidar queries: `['uploads']`, `['dashboard']`, `['dashboard-data-range']`, `['financial-entries']`, `['sales-records']`.
- No card existente, mostrar badge discreto "API" quando `source='api'` (consultar tipo gerado após migration).

## Comportamento

- Reexecutar para o mesmo mês/PDV apenas atualiza pedidos via `upsert` — nenhum registro duplicado, nenhum manual/planilha tocado.
- Erro em um PDV não cancela os outros (sucesso parcial reportado).
- Card único por (PDV, período, source='api') garantido pelo índice parcial.
- Upload manual e planilha continuam intocados.

## Testes

- PDV de teste `machine_id=1001543` com mês conhecido: card aparece em `/uploads` com badge "API".
- Confirmar `sales_records.source='api'` e `upload_id` correto.
- Rodar 2× o mesmo mês/PDV: contagem estável, sem duplicatas.
- Credenciais inválidas: `status='error'` no card e `error_message` populado.
- Viewer não vê o botão.
- Vendas API entram nos KPIs/financeiro com os mesmos status canônicos das planilhas.

## Não-objetivos (fase 2)

- Agendamento automático (n8n / scheduled function).
- Backfill histórico em massa (acima de 12 meses).
- Sync de estoque via API (já existe `ingest-stock` separado).

## Assumptions

- API Kexiaozhan retorna pedidos paginados por `machineId` + filtro de mês + `type=1` (conforme plano original).
- `period` segue o formato livre já usado nos uploads manuais (compatível com `'YYYY-MM'`).
- Usuário sincroniza interativamente em v1; flag `INGEST_REVENUE_ENABLED` deve ficar `true` apenas após validação.
