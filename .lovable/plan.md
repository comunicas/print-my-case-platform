

## Correção dos Cálculos de Status e Filtros do Estoque

### Problema Principal: Status "Repor" ignora vendas

A função `getProductStatus` (stockUtils.ts:128) calcula o status baseado **apenas na quantidade em estoque**, ignorando completamente as vendas. Resultado: Galaxy A53 com 0/7 de estoque e **0 vendas** aparece como "Repor" — mas não faz sentido repor um produto que ninguém compra.

**Lógica atual (errada):**
```text
avgQuantity <= 2  →  restock (SEMPRE, mesmo com 0 vendas)
```

**Lógica corrigida:**
```text
avgQuantity <= 2 + vendas alta/média  →  restock (urgente, vende e está acabando)
avgQuantity <= 2 + vendas baixa       →  restock (menor urgência, mas vende)
avgQuantity <= 2 + vendas nenhuma     →  ok (não vende, não precisa repor)
hasOutOfStock + estoque redistribuível →  redistribute
tudo certo                             →  ok
```

### Problema Secundário: Filtro de status no grid usa lógica diferente

Em `useProductStock.ts:126`, o filtro de status para slots usa `getProductActionStatus(s.quantity)` que é puramente baseado em quantidade. Isso pode causar inconsistências entre a tabela (que usa `getProductStatus` agregado) e o grid (que usa a lógica individual).

### Plano de Correção (3 etapas)

**Etapa 1 — `src/lib/stockUtils.ts`**: Corrigir `getProductStatus` para considerar `salesIndex`

- Produto com `avgQuantity <= 2` + `salesIndex === 'none'` → `'ok'` (não vende, não repor)
- Produto com `avgQuantity <= 2` + `salesIndex !== 'none'` → `'restock'` (vende e está acabando)
- Manter lógica de redistribute inalterada
- Atualizar `getProductActionStatus` (slot-level) para aceitar `salesIndex` opcional, garantindo consistência

**Etapa 2 — `src/hooks/useProductStock.ts`**: Corrigir filtro de status para slots

- Linha 126: ao filtrar slots por status, usar o status do **produto agregado** em vez do cálculo individual do slot, garantindo consistência entre tabela e grid

**Etapa 3 — Verificação dos demais filtros**

- **Filtro de marca**: Correto — compara `p.brand === brandFilter` ✓
- **Filtro de índice de vendas**: Correto — compara `p.salesIndex === salesIndexFilter` ✓
- **Filtro de busca**: Correto — usa `matchesSearchFilter` com exact match ✓
- **Filtro de status de venda**: Correto — muda os status no query SQL ✓

### Impacto esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Galaxy A53 (0/7, 0 vendas) | ❌ Repor | ✅ Ok |
| iPhone 14 Pro Max (1/7, 6 vendas média) | Repor | Repor (correto, vende) |
| Produto com 0/7 + 20 vendas | Repor | Repor (correto, vende muito) |
| KPI "Produtos Críticos" | 25 | Reduz para apenas os que vendem |

### Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/stockUtils.ts` | `getProductStatus`: adicionar parâmetro `salesIndex`, ajustar lógica. `getProductActionStatus`: aceitar `salesIndex` opcional |
| `src/hooks/useProductStock.ts` | Filtro de slots por status: usar status do produto agregado |

Sem migrations necessárias.

