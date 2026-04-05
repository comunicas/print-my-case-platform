

## Corrigir 5 Testes Falhando em `getLowStockItems`

### Causa Raiz

A função `getLowStockItems` filtra itens com `salesIndex === 'none'` (linha 336 de `dashboardUtils.ts`). Isso é intencional: alertas de estoque só são relevantes para produtos que vendem. Porém, 5 testes passam `new Map()` vazio como vendas, fazendo todos os itens serem filtrados.

### Correções

**Arquivo**: `src/lib/__tests__/dashboardUtils.test.ts`

1. **Teste "deve filtrar apenas itens com estoque <= threshold"** (linha 696): Adicionar vendas para os 2 produtos que devem aparecer no resultado.

2. **Teste "deve respeitar threshold customizado"** (linha 709): Adicionar vendas para o produto.

3. **Teste "deve calcular salesIndex corretamente"** (linha 719): Remover a expectativa de `salesIndex: 'none'` do resultado (esse item é filtrado intencionalmente). Ajustar `toHaveLength` de 4 para 3.

4. **Teste "deve ordenar por quantidade crescente"** (linha 742): Adicionar vendas para os 2 produtos.

5. **Teste "deve incluir pdvName quando disponível"** (linha 754): Adicionar vendas para o produto.

### Resultado

Todos os 76 testes passarão, incluindo os 5 corrigidos. Zero mudanças na lógica de negócio.

