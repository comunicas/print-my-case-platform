

## Nova Aba "Vendas" na Página de Uploads — CRUD de sales_records

### Resumo

Adicionar uma aba de navegação na página de Uploads com duas abas: **Uploads** (conteúdo atual) e **Vendas** (tabela CRUD completa de `sales_records`).

### Layout

```text
┌─────────────────────────────────────────────┐
│ Uploads                                     │
├─────────────────────────────────────────────┤
│  [Uploads]  [Vendas]                        │
├─────────────────────────────────────────────┤
│ Aba Vendas:                                 │
│ ┌─ Filtros ─────────────────────────────┐   │
│ │ [Busca] [PDV ▾] [Status ▾] [Período]  │   │
│ └───────────────────────────────────────┘   │
│ ┌─ Tabela ──────────────────────────────┐   │
│ │ Pedido | Produto | Valor | Data | ... │   │
│ │  [Editar] [Excluir]                   │   │
│ └───────────────────────────────────────┘   │
│ [+ Nova Venda]     Paginação                │
└─────────────────────────────────────────────┘
```

### Alterações por arquivo

1. **`src/hooks/useSalesRecords.ts`** (novo) — Hook com:
   - Query paginada de `sales_records` com joins em `pdvs(name)` 
   - Filtros server-side: PDV, status, busca por product_name/order_number
   - Mutation `create` — insere registro com `source = 'manual'`
   - Mutation `update` — atualiza campos editáveis
   - Mutation `delete` — remove registro individual
   - Respeita RLS existente (admin pode CRUD, users podem visualizar)

2. **`src/components/upload/SalesRecordsTab.tsx`** (novo) — Componente com:
   - Tabela com colunas: Pedido, Produto, Valor, Data Pagamento, Método, Status, Reembolso, PDV
   - Filtros: busca, PDV, status
   - Botão "+ Nova Venda" (apenas admin)
   - Ações por linha: Editar (abre dialog), Excluir (confirmação)
   - Paginação server-side

3. **`src/components/upload/SalesRecordFormDialog.tsx`** (novo) — Dialog para criar/editar:
   - Campos: PDV (select), device_id, order_number, product_name, amount, payment_date, payment_method, status, refund_amount
   - Validação com zod
   - Modo criação e edição (preenchido com dados existentes)

4. **`src/pages/Uploads.tsx`** — Envolver conteúdo existente em `Tabs`:
   - Tab "Uploads" com todo o conteúdo atual
   - Tab "Vendas" com `<SalesRecordsTab />`
   - Controle de aba via state (ou query param `?tab=`)

### Colunas exibidas na tabela

| Coluna | Campo | Formato |
|--------|-------|---------|
| Pedido | `order_number` | texto |
| Produto | `product_name` | texto |
| Valor | `amount` | R$ formatado |
| Data | `payment_date` | dd/MM/yyyy HH:mm |
| Método | `payment_method` | texto |
| Status | `status` | badge |
| Reembolso | `refund_amount` | R$ (se > 0) |
| PDV | `pdv.name` | texto |
| Ações | — | editar/excluir |

### Permissões

- Visualização: todos com acesso ao PDV (RLS `user_can_access_pdv`)
- Criar/Editar/Excluir: apenas admins (RLS existente cobre isso)
- Botões de ação escondidos para não-admins via `useProfile().isAdmin`

### Sem alteração de banco

As RLS policies de `sales_records` já permitem SELECT, INSERT, UPDATE e DELETE para admins. Nenhuma migration necessária.

