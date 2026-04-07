

## Fix: Lista de Produtos Não Aparece no Formulário de Compra

### Causa Raiz

A query em `usePreStock.ts` que busca nomes de produtos usa um filtro via join que não funciona corretamente com o PostgREST do Supabase:

```ts
.select("product_name, pdv:pdvs!inner(organization_id)")
.eq("pdv.organization_id", activeOrgId)
```

O filtro `.eq("pdv.organization_id", ...)` com alias não é suportado dessa forma — a query retorna array vazio silenciosamente, por isso "Nenhum produto encontrado".

### Solução

Alterar a query para buscar os `pdv_id`s da organização primeiro (já disponível via `usePDVs`), e depois filtrar `stock_records` com `.in("pdv_id", pdvIds)`:

**`src/hooks/usePreStock.ts`** — Reescrever a query de `productNames`:

1. Receber `pdvIds` como parâmetro (ou buscar PDVs internamente)
2. Usar `.from("stock_records").select("product_name").in("pdv_id", pdvIds)` 
3. Extrair nomes únicos e ordenar

Alternativa mais simples: fazer a query em duas etapas dentro do mesmo `queryFn`:
- Passo 1: buscar IDs dos PDVs da org via `supabase.from("pdvs").select("id").eq("organization_id", activeOrgId)`
- Passo 2: buscar `stock_records.product_name` filtrado por esses IDs

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/usePreStock.ts` | Reescrever query de productNames para usar 2-step approach com `pdv_id IN (...)` |

