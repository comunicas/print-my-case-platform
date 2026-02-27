

# Indicadores Visuais de Quantidade no Modo Compacto

## Objetivo
No modo compacto, os blocos empilhados ficam muito pequenos e dificeis de interpretar rapidamente. Adicionar um badge numerico de quantidade sobre cada slot para leitura instantanea.

## Alteracoes

### 1. `src/components/stock/SlotStack.tsx`

Adicionar um badge numerico (`quantity/MAX_CAPACITY`) visivel apenas no modo compacto, posicionado entre os blocos e o numero do slot. O badge tera cor de fundo baseada no status do estoque (critico, baixo, medio, cheio) para reforcar visualmente a urgencia.

```text
Modo compacto atual:        Modo compacto novo:
  [logo]                      [logo]
  [blocos]                    [blocos]
  [slot]                      [2/7]    ← badge colorido
  [modelo]                    [slot]
                              [modelo]
```

Cores do badge:
- 0 unidades: vermelho (bg-red-500)
- 1-2 unidades: laranja (bg-orange-500)
- 3-5 unidades: amarelo (bg-yellow-500)
- 6-7 unidades: verde (bg-green-500)
- Inativo: cinza (bg-muted)

O badge sera um `span` com `text-[7px] sm:text-[8px]`, `font-bold`, `text-white`, `rounded-full`, `px-1`, renderizado condicionalmente quando `viewMode === 'compact'`.

No modo expandido, nada muda — os blocos ja sao grandes o suficiente para leitura visual.

### 2. `src/lib/stockGridUtils.ts`

Adicionar uma funcao utilitaria `getQuantityBadgeColor(quantity, isActive)` que retorna a classe de cor do badge baseada nos thresholds existentes (`STOCK_THRESHOLDS`).

### Resumo

- 1 funcao nova em `stockGridUtils.ts`
- 1 elemento JSX novo em `SlotStack.tsx` (condicional ao modo compacto)
- Zero mudancas em dimensoes, layout ou outros componentes

