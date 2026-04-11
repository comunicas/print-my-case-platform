

## Corrigir Filtros de Status no Modo "Todas as Organizações" + Fix Hook Error

### Problema Raiz

Quando "Todas as organizações" está ativo, a função `aggregateProductStock` agrupa o **mesmo produto de PDVs diferentes** em um único registro. Isso soma as quantidades — ex: iPhone 11 com qty=0 no BOULEVARD TATUAPE + qty=15 em outros PDVs = totalQuantity=15 → status "Perfeito", não "Repor".

O filtro "Repor" (e todos os outros status) usa o `totalQuantity` agregado, então produtos que precisam reposição em um PDV específico desaparecem quando vistos globalmente.

### Solução

**Mudar a chave de agrupamento para incluir o PDV quando `selectedPdv === 'all'`**. Assim cada combinação produto+PDV gera uma linha independente na tabela, mantendo o status correto por máquina.

### Mudanças

**1. `src/lib/stockUtils.ts` — nova função `aggregateProductStockByPdv`**
- Quando no modo multi-PDV, a chave de agrupamento será `productName|pdvId` em vez de apenas `productName`
- Cada linha mostra o status real daquele produto naquele PDV específico
- Adicionar campo `pdvName` ao tipo `ProductStock` para exibição

**2. `src/hooks/useProductStock.ts` — usar agrupamento correto**
- Quando `selectedPdv === 'all'`, chamar `aggregateProductStockByPdv` (agrupa por produto+PDV)
- Quando um PDV específico está selecionado, manter `aggregateProductStock` atual (agrupa só por produto)

**3. `src/components/stock/ProductStockTable.tsx` — mostrar coluna PDV + fix hooks**
- Quando `selectedPdv === 'all'`, exibir coluna "PDV" na tabela para identificar a máquina
- **Fix crítico**: mover `useIsMobile()` para antes dos early returns (causa o erro "Rendered fewer hooks than expected")

**4. `src/lib/stockTypes.ts` — adicionar `pdvName?` ao tipo `ProductStock`**

### O que NÃO muda
- Filtro por PDV específico continua funcionando como antes (agrupamento por produto)
- Lógica de status, vendas e capacidade não muda
- Grid/Mapa não é afetado (já funciona por slot individual)

### Resultado
- Filtro "Repor" em "Todas as organizações" mostra TODOS os produtos com qty=0 em qualquer PDV
- Todos os filtros de status ficam corretos no modo global
- Erro de hooks resolvido

