

## Fix: KPIs Zerados no Modal de Produto

### Causa Raiz

O `productName` passado ao modal é um **productKey** no formato `"APPLE:iphone 11"` (com dois-pontos). O hook `useProductAnalytics` usa esse valor diretamente no filtro `ilike`:

```typescript
.ilike('product_name', `%APPLE:iphone 11%`)
```

Mas no banco, o campo `product_name` contém `"APPLE iPhone 11"` ou `"iPhone 11"` — nunca o formato com `:`. Resultado: zero linhas retornadas, KPIs zerados.

O gráfico de histórico (`useProductSalesHistory`) funciona porque **não usa `ilike`** — busca todos os dados e filtra client-side com `filterSalesByProduct`, que trata o formato com `:` corretamente.

### Correção

**Arquivo:** `src/hooks/useProductAnalytics.ts`

Extrair o **modelo** do productKey antes de usar no `ilike`:

```typescript
// Antes (bugado)
.ilike('product_name', `%${productName}%`)

// Depois (correto)
const modelForQuery = extractModelFromProductName(productName);
// ...
.ilike('product_name', `%${modelForQuery}%`)
```

Adicionar import de `extractModelFromProductName` do `productNormalization`.

O `filterSalesByProduct` client-side continua garantindo matching exato após o pre-filter.

### Resultado

- KPIs (Vendas, Receita, Ticket Médio) passam a mostrar valores corretos
- Gráfico de histórico continua funcionando como antes
- O `ilike` continua servindo como pre-filter eficiente (~90% redução), e o `filterSalesByProduct` refina o matching exato

