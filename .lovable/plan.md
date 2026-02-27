
# Indicador Visual de Quantidade no Modo Expandido (Hover)

## Objetivo
Adicionar o mesmo badge numerico de quantidade (`X/7`) que ja existe no modo compacto, mas no modo expandido ele aparece apenas ao passar o mouse sobre o slot (hover). Isso mantem o visual limpo e mostra a informacao sob demanda.

## Verificacao do Modo Compacto
Badges verificados e funcionando corretamente:
- Cores corretas por nivel de estoque (verde, amarelo, laranja, vermelho)
- Texto legivel com quantidade/capacidade
- Posicionamento correto entre blocos e numero do slot

## Alteracao

### `src/components/stock/SlotStack.tsx`
Adicionar o badge de quantidade tambem no modo expandido, mas com classes CSS que o tornam invisivel por padrao e visivel no hover do container pai.

Implementacao com CSS puro usando `group` + `group-hover`:
1. Adicionar classe `group` ao `div` container do slot (linha 39)
2. Renderizar o badge em ambos os modos, mas no modo expandido aplicar `opacity-0 group-hover:opacity-100 transition-opacity` para aparecer apenas no hover

```text
Modo expandido (repouso):     Modo expandido (hover):
  [logo]                        [logo]
  [blocos]                      [blocos]
                                [5/7]    ← badge aparece
  [slot]                        [slot]
  [modelo]                      [modelo]
```

Mudancas especificas:
- Linha 39: adicionar `group` a className do div container
- Linhas 72-80: remover condicional `viewMode === 'compact'`, renderizar sempre o badge
- No modo expandido: adicionar `opacity-0 group-hover:opacity-100 transition-opacity duration-200`
- No modo compacto: manter visibilidade permanente (sem classes de opacity)
- Tamanho do badge no expanded: `text-[8px] sm:text-[9px]` (ligeiramente maior que no compacto)
