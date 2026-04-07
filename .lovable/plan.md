## Módulo de Pré-Estoque (Compras) — Documentação Técnica

### Tabela `pre_stock`

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `id` | uuid | `gen_random_uuid()` | PK |
| `organization_id` | uuid | — | FK → organizations |
| `pdv_id` | uuid | NULL | PDV de origem (opcional) |
| `allocated_pdv_id` | uuid | NULL | PDV de destino (preenchido na alocação total) |
| `product_name` | text | — | Nome do produto |
| `quantity` | integer | — | Quantidade comprada |
| `remaining_quantity` | integer | — | Saldo restante (decrementado pela dedução) |
| `unit_cost` | numeric | 15 | Custo unitário em R$ |
| `status` | text | `'pending'` | `pending` ou `allocated` |
| `created_by` | uuid | — | Usuário que registrou |
| `notes` | text | NULL | Observações |
| `created_at` | timestamptz | `now()` | Data de criação |
| `updated_at` | timestamptz | `now()` | Última atualização |

### Fluxo de Dedução Automática

1. **Trigger**: Upload de planilha de estoque (`process-spreadsheet`) ou inserção via API (`ingest-stock`)
2. **Cálculo**: `increase = max(0, newQty - oldQty)` por produto — só deduz o **aumento real**
3. **Busca**: Itens `pending` com `remaining_quantity > 0`, filtrando por `organization_id`, `product_name`, e `pdv_id` (matching ou NULL)
4. **Dedução**: FIFO (mais antigos primeiro), decrementando `remaining_quantity`
5. **Alocação**: `allocated_pdv_id` só é preenchido quando `remaining_quantity` chega a **zero** (alocação total), evitando inconsistências em entregas parciais

### KPI Cards

- **Pendentes**: `SUM(remaining_quantity)` dos itens `pending` — query sem filtros
- **Valor Pendente**: `SUM(remaining_quantity × unit_cost)` dos pendentes
- **Alocados**: `SUM(quantity)` dos itens `allocated`

Os KPIs usam uma query separada (`pre_stock_summary`) sem filtros de PDV/status/search para refletir totais reais.

### Edge Functions Envolvidas

- `process-spreadsheet/index.ts` — Dedução após upload de planilha de estoque
- `ingest-stock/index.ts` — Dedução após inserção via API

### Arquivos Frontend

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/hooks/usePreStock.ts` | CRUD + summary query |
| `src/components/upload/PreStockForm.tsx` | Formulário de cadastro |
| `src/components/upload/PreStockTab.tsx` | KPIs + tabela + filtros |
