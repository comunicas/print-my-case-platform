

## Debug dos Filtros de Estoque — Análise e Plano

### Problema Identificado

Quando o filtro de PDV está em "Todos os PDVs", os dados ficam **incorretos** em duas áreas:

**1. Mapa (Grid View) — dados corrompidos**
O `StockGridView` cria um `Map<string, SlotData>` indexado por número do slot (ex: "34"). Com dois PDVs selecionados, slots com o mesmo número se sobrescrevem — só o último PDV "ganha". O mapa mostra dados de apenas um PDV, misturados.

**2. KPIs — capacidade total errada**
O cálculo de KPIs usa `GRID_LAYOUT` (85 slots fixos de uma máquina). Com "Todos os PDVs", deveria ser 85 × N máquinas, mas calcula como 85.

**3. Tabela — funciona parcialmente**
A tabela agrupa por `productKey` (modelo), então produtos iguais de PDVs diferentes são somados. Isso funciona para visão agregada mas pode confundir.

### Diagnóstico do filtro atual

O `PDVFilter` já auto-seleciona quando há apenas 1 PDV e esconde o dropdown. Porém, para usuários com acesso a múltiplos PDVs, o padrão é "Todos os PDVs" — o que causa os problemas acima.

O filtro de PDV atualmente está mostrando apenas "Tietê Plaza Shopping" como texto estático, o que indica que o usuário logado só tem acesso a 1 PDV via `user_pdvs`. O Boulevard pode não estar aparecendo por restrição de acesso.

### Plano de Correção

**Alteração 1 — `src/components/stock/StockGridView.tsx`**
- Quando `selectedPdv === 'all'` e há dados de múltiplos PDVs, exibir um aviso pedindo para selecionar um PDV específico para o mapa
- Agrupar slots por `pdvId` e renderizar grids separados por PDV (com título do PDV acima de cada grid), OU bloquear o mapa sem PDV selecionado

**Alteração 2 — `src/hooks/useProductStock.ts`**
- Calcular `totalSlots` dinamicamente: `85 × quantidade de PDVs distintos nos dados` em vez de fixo em 85
- Isso corrige os KPIs de capacidade quando "Todos os PDVs" está selecionado

**Alteração 3 — `src/components/stock/StockGridView.tsx` (slotMap)**
- Mudar a chave do `slotMap` de `slot.slot` para `${slot.pdvId}-${slot.slot}` quando múltiplos PDVs estão presentes
- Renderizar um grid por PDV com o nome do PDV como título

### Abordagem Recomendada

Renderizar **grids separados por PDV** quando "Todos os PDVs" está selecionado:

```text
┌─────────────────────────┐
│ Boulevard Tatuapé       │
│ ┌───┬───┬───┬───┬───┐   │
│ │99 │98 │97 │...│91 │   │
│ └───┴───┴───┴───┴───┘   │
└─────────────────────────┘
┌─────────────────────────┐
│ Tietê Plaza Shopping    │
│ ┌───┬───┬───┬───┬───┐   │
│ │99 │98 │97 │...│91 │   │
│ └───┴───┴───┴───┴───┘   │
└─────────────────────────┘
```

### Resumo de arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `StockGridView.tsx` | Agrupar slots por PDV, renderizar grid separado por PDV |
| `useProductStock.ts` | Calcular `totalSlots` dinamicamente (85 × N PDVs) |

