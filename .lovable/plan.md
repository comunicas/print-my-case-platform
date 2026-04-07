

## Plano: Módulo de Pré-Estoque (Compras)

### Conceito

Nova aba "Compras" na página de Uploads onde o usuário registra produtos comprados que ainda não foram alocados nas máquinas. Quando o estoque é atualizado (via planilha ou API), os itens correspondentes são automaticamente deduzidos do pré-estoque.

### Fluxo do Usuário

```text
1. Aba "Compras" → Botão "Registrar Compra"
2. Modal: seleciona PDV, busca produto (autocomplete da lista de stock_records), informa quantidade
3. Item aparece na lista de pré-estoque com status "Pendente"
4. Quando um upload de estoque é processado → trigger deduz automaticamente
5. Se qty pré-estoque chega a 0 → status muda para "Alocado"
```

### Banco de Dados

Nova tabela `pre_stock`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | PK |
| organization_id | uuid | Org do usuário |
| pdv_id | uuid | PDV destino (opcional, pode ser geral) |
| product_name | text | Nome do produto |
| quantity | integer | Quantidade comprada |
| remaining_quantity | integer | Quantidade ainda não alocada |
| status | text | `pending` / `allocated` |
| created_by | uuid | Quem registrou |
| created_at | timestamptz | Data do registro |
| notes | text | Observações opcionais |

RLS: mesma lógica de `stock_records` (org-based + admin).

### Dedução Automática

Na Edge Function `process-spreadsheet` (tipo stock) e na `ingest-stock`, após inserir/atualizar `stock_records`:
- Buscar itens de `pre_stock` com `remaining_quantity > 0` e mesmo `product_name` + `pdv_id`
- Deduzir a diferença positiva (estoque novo - estoque anterior)
- Atualizar `remaining_quantity` e marcar `allocated` se chegar a 0

### Frontend

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Uploads.tsx` | Adicionar aba "Compras" |
| `src/components/upload/PreStockTab.tsx` | **Novo** — Lista de pré-estoque com filtros |
| `src/components/upload/PreStockForm.tsx` | **Novo** — Modal para registrar compra |
| `src/hooks/usePreStock.ts` | **Novo** — CRUD de pré-estoque |
| Migration SQL | Criar tabela `pre_stock` + RLS |
| `supabase/functions/process-spreadsheet/index.ts` | Dedução automática ao processar estoque |
| `supabase/functions/ingest-stock/index.ts` | Dedução automática via API |

### Interface da Aba "Compras"

- Filtros: PDV, status (Pendente/Alocado), busca por produto
- Tabela: Produto, Qtd Comprada, Qtd Restante, Status, Data, Ações
- Botão "Registrar Compra" abre modal com:
  - Select de PDV
  - Autocomplete de produto (lista de `stock_records` distintos)
  - Input de quantidade
  - Campo de observações (opcional)

### Etapas de Implementação

1. **Criar tabela** `pre_stock` + RLS policies
2. **Criar hook** `usePreStock` (CRUD + listagem paginada)
3. **Criar componentes** `PreStockTab` + `PreStockForm`
4. **Adicionar aba** na página Uploads
5. **Integrar dedução** nas Edge Functions de estoque

