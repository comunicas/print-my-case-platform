## Refatoração mobile do filtro de período (Dashboard)

**Problema:** No mobile (375–390px) os botões "Hoje | Ontem | Este mês | Mês anterior | Total | 📅" não cabem em uma linha. Hoje há `overflow-x-auto` na barra, mas o scroll horizontal interno fica escondido (sem indicador visual) e dá a impressão de layout quebrado — exatamente o que aparece no print enviado.

### Solução

Refatorar apenas `src/components/dashboard/DateRangeFilter.tsx` para usar um layout dedicado em mobile, mantendo o desktop intacto.

**Layout mobile (< md):**

```text
┌─────────────────────────────────┐
│ [ Hoje ]   [ Ontem ]            │  grid 2 colunas, h-10
│ [ Este mês ] [ Mês anterior ]   │
│ [ Total ]  [ 📅 Personalizado ] │
├─────────────────────────────────┤
│ 01/12/2025 – 06/05  (157 dias)  │  linha separada, com flex-wrap
│ ↺                                │
└─────────────────────────────────┘
```

- Container externo: `flex flex-col gap-3` em mobile / `sm:flex-row sm:items-center` em desktop (mantém o atual).
- Grupo de presets: `grid grid-cols-2 gap-2 w-full` em mobile / `md:flex md:items-center md:gap-1 md:flex-nowrap md:w-auto` em desktop. Remove `overflow-x-auto` no mobile (não precisa mais).
- Botões: `w-full md:w-auto`, mantém `h-10 sm:h-8` e `touch-manipulation`.
- Botão do calendário customizado: passa a ter um label "Personalizado" + ícone no mobile (`md:sr-only` no texto) para ficar claro que é um período custom; em desktop continua só ícone + chevron.
- Bloco "Período Info": já tem `flex-wrap`; garantir `w-full` em mobile e que o range de dados (`Dados: ...`) continue oculto em mobile (`hidden sm:inline`).

**Desktop (≥ md):** comportamento atual preservado — uma única linha com presets + date picker à esquerda e info à direita.

### Arquivos alterados

- `src/components/dashboard/DateRangeFilter.tsx` — único arquivo. Apenas classes Tailwind/JSX de layout; nenhuma mudança em lógica de datas, presets, popover, calendário, validação ou contratos do componente.

### Não escopo

- Sem mudanças em `Index.tsx`, hooks, lógica de negócio, ou outros filtros.
- Sem alteração de cores, tokens ou comportamento desktop.
- Sem mexer no Popover do calendário (o conteúdo interno do date picker já abre em portal e não é afetado).

### Verificação

1. Preview em 375 e 390px: 6 controles visíveis sem scroll horizontal, todos com toque ≥ 40px.
2. Preview em ≥ 768px: layout idêntico ao atual (uma linha).
3. Selecionar cada preset, abrir o date picker, escolher range custom — comportamento inalterado.
4. Conferir que não aparece scroll horizontal no `<main>` em nenhum breakpoint.
