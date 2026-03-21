

## CRUD de Estoque por PDV — Gerenciamento Direto

### Contexto

Hoje os `stock_records` só entram via upload de planilha. O campo `upload_id` é NOT NULL, impedindo inserções manuais. O usuário quer adicionar, editar e excluir linhas de estoque diretamente por PDV.

### Abordagem

Tornar `upload_id` nullable em `stock_records` para permitir registros manuais (sem upload associado), e criar uma interface CRUD na página de Estoque.

### Alterações

**1. Migração — `stock_records.upload_id` nullable**
```sql
ALTER TABLE stock_records ALTER COLUMN upload_id DROP NOT NULL;
```

**2. `src/hooks/useStockCRUD.ts`** (novo)
- Hook com mutations para INSERT, UPDATE e DELETE em `stock_records`
- INSERT: cria registro com `upload_id = null`, `pdv_id`, `device_id` (do PDV), `slot_number`, `product_name`, `quantity`, `is_active`
- UPDATE: atualiza `product_name`, `quantity`, `is_active`
- DELETE: remove registro por ID
- Invalida queries `['slots-data']` e `['product-stock']` no sucesso

**3. `src/components/stock/StockCRUDDialog.tsx`** (novo)
- Dialog para adicionar/editar registro de estoque
- Campos: Slot, Produto, Quantidade, Ativo (switch)
- Modo edição pré-preenche dados existentes
- Validação: slot obrigatório, produto obrigatório, quantidade ≥ 0

**4. `src/components/stock/ProductStockTable.tsx`** — Adicionar ações
- Botão "+" no header para adicionar novo registro
- Botões de editar/excluir em cada linha (visíveis apenas para admins)
- Confirmação de exclusão com AlertDialog

**5. `src/components/stock/StockGridView.tsx`** — Adicionar ação de edição
- Menu de contexto ou botão no card do slot para editar/excluir

### Fluxo

1. Admin seleciona PDV no filtro
2. Clica "+" → abre dialog com campos vazios → salva → registro aparece na tabela
3. Clica editar em linha existente → dialog pré-preenchido → salva
4. Clica excluir → confirmação → remove registro

### Considerações

- RLS existente já cobre INSERT/UPDATE/DELETE para admins na mesma org
- `device_id` será obtido do PDV selecionado (campo `machine_id` da tabela `pdvs`)
- Registros manuais coexistem com registros importados por planilha
- Queries existentes (`useSlotsData`) já funcionam sem filtrar por `upload_id`

