

## KPI Cards + Custo Unitário no Pré-Estoque

### Resumo

Adicionar coluna `unit_cost` à tabela `pre_stock` (default R$15), exibir campo no formulário de cadastro, e mostrar cards de resumo no topo da aba Compras.

### 1. Migration — Adicionar `unit_cost`

```sql
ALTER TABLE public.pre_stock
ADD COLUMN unit_cost numeric NOT NULL DEFAULT 15;
```

Registros existentes receberão automaticamente o valor 15.

### 2. KPI Cards no topo da aba

Três cards calculados a partir dos `items` já carregados:

| Card | Cálculo |
|------|---------|
| **Pendentes** | Soma de `remaining_quantity` dos itens com status `pending` |
| **Valor Pendente** | Soma de `remaining_quantity × unit_cost` dos pendentes |
| **Alocados** | Soma de `quantity` dos itens com status `allocated` |

Usar o componente `Card` existente com ícones (Package, DollarSign, CheckCircle).

### 3. Formulário — Campo "Custo unitário"

**`PreStockForm.tsx`**: Adicionar campo `Input` numérico com default "15" entre Quantidade e Observações. Incluir `unit_cost` no payload do `onSubmit`.

### 4. Hook — Persistir `unit_cost`

**`usePreStock.ts`**: Adicionar `unit_cost` ao `PreStockItem` interface e ao `insert` da mutation. Incluir no input type.

### 5. Tabela — Mostrar custo

Adicionar coluna "Custo Un." na tabela exibindo `R$ {item.unit_cost.toFixed(2)}`.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `ADD COLUMN unit_cost numeric NOT NULL DEFAULT 15` |
| `src/hooks/usePreStock.ts` | Adicionar `unit_cost` à interface e mutation |
| `src/components/upload/PreStockForm.tsx` | Campo custo unitário com default 15 |
| `src/components/upload/PreStockTab.tsx` | KPI cards + coluna custo na tabela |

