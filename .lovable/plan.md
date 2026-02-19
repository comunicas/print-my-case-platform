
# Correção: Subtitle "126 desistências" Truncado no Card Cancelamentos

## Diagnóstico

No card **Cancelamentos** em 6 colunas (1280px+), a linha inferior tem dois elementos juntos:
- Badge `+40.2%` (largura fixa ~52px)
- Span `"126 desistências"` com `truncate` — trunca para `"126 desistên..."`

O `flex gap-1` na linha inferior deixa pouco espaço para o subtitle quando há badge presente. O mesmo ocorre potencialmente no card **Estoque Crítico** com `"Slots com 0-1 unidades"` — que visualmente parece ok porque não tem badge junto.

## Causa no Código

`KPICard.tsx` linha 64-94 — a div de tendência/subtitle usa um único `flex` sem responsividade para o caso de badge + subtitle simultâneos:

```tsx
<div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1 min-h-[18px]">
  {showTrend && <Badge>...</Badge>}
  {subtitle && (
    <span className="text-[10px] md:text-xs text-muted-foreground truncate">
      {subtitle}
    </span>
  )}
</div>
```

O span do subtitle tem `truncate` mas sem `min-w-0` — em flex containers isso pode fazer o elemento não encolher adequadamente.

## Solução

Duas mudanças pequenas em `KPICard.tsx`:

**1. Adicionar `min-w-0` no span do subtitle** para garantir que o flex item possa encolher e o `truncate` funcione com ellipsis limpo:
```tsx
<span className="text-[10px] md:text-xs text-muted-foreground truncate min-w-0">
```

**2. Adicionar `overflow-hidden` na div container** da linha de trend/subtitle para garantir que o conteúdo interno não vaze:
```tsx
<div className="flex items-center gap-1 md:gap-2 mt-0.5 md:mt-1 min-h-[18px] overflow-hidden">
```

**3. Opção alternativa considerada — quebrar em duas linhas:**
Separar badge e subtitle em linhas distintas com `flex-col` quando ambos existem. Porém isso aumenta a altura mínima do card em todos os breakpoints e muda o design estabelecido. A solução com `min-w-0 + overflow-hidden` é menos invasiva e resolve o truncamento correto.

## Arquivo a Modificar

**`src/components/dashboard/KPICard.tsx`** — apenas 2 linhas alteradas:

- Linha 64: adicionar `overflow-hidden` no container da row de trend/subtitle
- Linha 93: adicionar `min-w-0` no span do subtitle

## O Que NÃO muda

- Grid breakpoints (`xl:grid-cols-6`) — já correto e aprovado
- Tamanhos de fonte do KPICard — já corretos
- Lógica de trends e dados — sem toque
- Todos os outros cards sem subtitle (Receita, Transações, Ticket Médio, Reembolsos) — não afetados

## Resultado Esperado

| Card | Antes | Depois |
|---|---|---|
| Cancelamentos 6 col | `+40.2%` `126 desistên...` | `+40.2%` `126 desistências` (com ellipsis se ainda necessário, mas sem corte abrupto) |
| Estoque Crítico | `Slots com 0-1 unidades` | Inalterado (já ok) |
