
# Correção: Valores Truncados nos KPI Cards em Desktop Médio

## Diagnóstico Confirmado pelos Prints

### Print 1 (Desktop ~1280px com sidebar expandida)
Os cards mostram `R$ 13.3...` e `R$ 6.86...` — valores truncados pelo `truncate` do elemento `kpi-value`. A causa é o breakpoint `lg:grid-cols-6` que ativa 6 colunas a partir de 1024px. Com sidebar de ~240px, o espaço por card é de apenas ~125px, insuficiente para `R$ 13.321,80` em `text-2xl` (24px bold).

### Print 2 (Tablet ~820px com sidebar icônica)
Layout em 3 colunas está correto e sem truncamento. Funciona bem.

### Print 4 (Mobile ~390px)
Grid 2 colunas funcionando corretamente.

### ✅ Confirmados funcionando corretamente
- **Ticket Médio com `+1.6%` badge**: Implementado e visível nos prints 1 e 2
- **StockHistoryChart**: Já usa `ChartCard` com ícone `History` e botões de período (7d/15d/30d/90d)
- **LossAnalysisCard**: Com `animate-fade-in-up` implementado
- **`testId` em LossesByDayChart**: Adicionado

## Problema Central: Overflow de Texto nos KPI Cards

### Causa Raiz

```
Viewport 1280px
- Sidebar: 240px
- Padding layout: ~32px
- Espaço disponível: ~1008px
- 6 colunas + gaps (4px × 5): ~163px por card
- Padding interno do card: 12px × 2 = 24px
- Área de texto: ~139px
- "R$ 13.321,80" em text-2xl bold: ~170px → TRUNCA
```

### Solução: Duas mudanças coordenadas

**1. Mudar o breakpoint do grid de `lg` para `xl`:**
```tsx
// ANTES:
"grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4"

// DEPOIS:
"grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-4"
```

Com `xl` (1280px+): `(1280-240-32)/6 ≈ 168px` por card — suficiente.
Em `lg` (1024-1279px): permanece em 3 colunas — ~330px por card, sem truncamento.

**2. Ajustar o tamanho de fonte do valor em `KPICard` para escalar melhor:**

O valor usa `text-base md:text-2xl`. Em `xl` com 6 colunas, `text-2xl` ainda pode truncar em valores mais longos. Adicionar um breakpoint intermediário `lg:text-xl xl:text-lg` para quando estiver em 6 colunas (a partir de `xl`) usar fonte menor:

```tsx
// ANTES:
"text-base md:text-2xl font-bold text-foreground truncate"

// DEPOIS:
"text-base md:text-xl xl:text-base font-bold text-foreground truncate"
```

Isso garante que em 6 colunas (`xl`+) o valor usa `text-base` — legível e sem truncamento.

**3. Ajustar padding do `KPICard` em `xl` para ser mais compacto:**

O padding atual `px-3 md:px-6` em 6 colunas desperdiça espaço. Adicionar `xl:px-3` para reduzir:

```tsx
// CardHeader:
"flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 xl:px-3 pt-3 md:pt-6 xl:pt-3"

// CardContent:
"px-3 md:px-6 xl:px-3 pb-3 md:pb-6 xl:pb-3"
```

## Arquivos a Modificar

### Arquivo 1: `src/pages/Index.tsx` — linha 344
Mudar `lg:grid-cols-6` → `xl:grid-cols-6` no grid de KPIs.

### Arquivo 2: `src/components/dashboard/KPICard.tsx` — linhas 55-62
Ajustar tamanho de fonte e padding para o breakpoint `xl` (quando estiver em 6 colunas):
- Valor: `text-base md:text-xl xl:text-base`
- Padding header: `px-3 md:px-6 xl:px-3 pt-3 md:pt-6 xl:pt-3`
- Padding content: `px-3 md:px-6 xl:px-3 pb-3 md:pb-6 xl:pb-3`
- Título: `text-[10px] md:text-sm xl:text-[10px]`

## O que NÃO muda
- Lógica de dados, trends e cálculos — sem toque
- Comportamento mobile (2 colunas) — sem alteração
- Comportamento tablet sm/md (3 colunas) — sem alteração
- Componentes `StockHistoryChart`, `LossAnalysisCard`, `LossesByDayChart` — já corretos
- Testes existentes — nenhuma interface pública alterada

## Resultado Esperado

| Viewport | Grid | Valor KPI | Truncamento |
|---|---|---|---|
| < 640px (mobile) | 2 colunas | `text-base` | Nenhum |
| 640-1279px (tablet/md) | 3 colunas | `text-xl` | Nenhum |
| 1280px+ (desktop largo) | 6 colunas | `text-base` | Nenhum |
