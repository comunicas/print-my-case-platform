

## Correção de Fuso Horário — 5 linhas em 2 arquivos

### Alterações

**1. `src/lib/dashboardUtils.ts`**

- **Linha 121** (`getSalesByDay`): `sale.payment_date.substring(0, 10)` → `format(parseISO(sale.payment_date), 'yyyy-MM-dd')`
- **Linha 420** (`getLossesByDay` — cancelamentos): mesma substituição
- **Linha 434** (`getLossesByDay` — reembolsos): mesma substituição

**2. `src/hooks/useProductAnalytics.ts`**

- **Linha 88** (vendas por hora): `date.getUTCHours()` → `date.getHours()`
- **Linha 115** (vendas por dia da semana): `date.getUTCDay()` → `date.getDay()`

### Nota sobre o contexto salvo

A memória do projeto diz que UTC foi escolhido intencionalmente, mas isso está incorreto: os timestamps no banco **não** são meia-noite UTC — são horários reais (ex: `22:58:48+00`). O `substring(0,10)` extrai o dia UTC, deslocando vendas noturnas BRT para o dia seguinte. A correção com `parseISO` + horário local resolve isso.

