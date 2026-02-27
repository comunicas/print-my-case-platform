

# Unificar Total de Estoque por Modelo no Mapa

## Problema
Quando um modelo (ex: iPhone 11) aparece em varios slots (96, 97, 98, 99), cada slot mostra apenas sua quantidade individual. Nao ha indicacao visual do estoque total daquele modelo na maquina.

## Solucao
Calcular o total agregado por modelo e exibir essa informacao em dois lugares:

### 1. Tooltip enriquecido
Ao passar o mouse sobre qualquer slot, o tooltip mostrara alem da info individual, uma linha com o total do modelo:

```text
iPhone 11
Slot 96 - 0/7 unidades
─────────────────────
Total: 22/28 em 4 slots
```

### 2. Badge de contagem de slots
Quando um modelo ocupa mais de 1 slot, exibir um pequeno indicador no canto superior direito do slot mostrando quantos slots compartilham aquele modelo (ex: "x4"). Visivel em ambos os modos.

```text
Antes:            Depois:
  [logo]            [logo]  x4
  [blocos]          [blocos]
  [badge]           [badge]
  [slot]            [slot]
  [modelo]          [modelo]
```

## Alteracoes Tecnicas

### `src/components/stock/StockGridView.tsx`
- Criar um `useMemo` que calcula `productTotals`: um Map de `productKey` para `{ totalQty, totalCapacity, slotCount }`
- Usar `getExactProductKey` (ja existente em `productNormalization`) para agrupar corretamente
- Passar `productTotals` para cada `SlotStack` via nova prop `aggregateInfo`

### `src/components/stock/SlotStack.tsx`
- Adicionar prop opcional `aggregateInfo?: { totalQty: number; totalCapacity: number; slotCount: number }`
- Se `slotCount > 1`:
  - Renderizar badge "xN" no canto superior direito do slot (texto pequeno, cor muted)
  - No tooltip, adicionar linha separadora + "Total: X/Y em N slots"
- Se `slotCount === 1`: nenhuma mudanca visual (nao polui a interface)

### Sem alteracoes em
- `stockGridUtils.ts` - nenhuma funcao nova necessaria
- `stockUtils.ts` - a agregacao ja existe para a tabela, aqui reutilizamos a logica de chave

