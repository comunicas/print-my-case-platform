
# Correção Definitiva: Dropdown de Mês/Ano no Calendário

## Diagnóstico Confirmado por Teste

Dois problemas distintos detectados no teste ao vivo:

**Problema 1 — NaN% (RESOLVIDO):** O card Reembolsos agora exibe **-100%** corretamente ao selecionar "Mês passado". O bug foi eliminado.

**Problema 2 — Dropdown de mês inacessível (AINDA PRESENTE):** O `captionLayout="dropdown-buttons"` insere os selects de Mês e Ano dentro do cabeçalho do calendário (topo do componente `DayPicker`). Quando o Radix Popover detecta que o calendário não cabe abaixo do trigger, ele o **flipa para cima** — e os controles do cabeçalho ficam fora da viewport superior. O `max-h-[85vh] overflow-y-auto` adicionado anteriormente não resolve porque o posicionamento do popover inteiro sai do topo da tela, não apenas o conteúdo interno.

**Evidência visual:**

```text
[topo da tela] ← cabeçalho com Month/Year dropdowns fica aqui (invisível)
─────────────────────────────────────────────────
  February     Year: [2026 ▼]   March     Year: [2026 ▼]
  Su Mo Tu We Th Fr Sa          Su Mo Tu We ...
   1  2  3  4  5  6  7 ...
```

Os dropdowns "Month:" ficam acima da área visível porque o `react-day-picker` os renderiza no topo de cada mês.

## Solução Definitiva

**Remover o `captionLayout="dropdown-buttons"` do Calendar** e substituir por selects de mês e ano **dentro do painel de inputs** que já existe no topo do popover — que é sempre visível independente do flip do Radix.

O calendário continuará usando navegação por setas (padrão), mas agora haverá dois selects de controle no painel superior do popover que atualizam o mês exibido via as props `month` e `onMonthChange` do `DayPicker`.

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────┐
│ [De: DD/MM/AAAA] → [Até: DD/MM/AAAA]   [X]        │  ← painel de inputs (sempre visível)
│ Mês: [Janeiro ▼] Ano: [2026 ▼]                     │  ← NOVO: selects de navegação aqui
├─────────────────────────────────────────────────────┤
│          ← February 2026 →    ← March 2026 →        │  ← calendário sem caption dropdown
│  Su Mo Tu We Th Fr Sa         Su Mo Tu We Th Fr Sa  │
│   1  2  3  4  5  6  7 ...                           │
└─────────────────────────────────────────────────────┘
```

## Mudanças Técnicas

### `src/components/dashboard/DateRangeFilter.tsx`

**Adicionar estado para o mês exibido:**
```typescript
const [currentMonth, setCurrentMonth] = useState<Date>(dateRange.from || new Date());
```

**Adicionar selects de Mês e Ano no painel de inputs** (logo após os campos De/Até):
```tsx
{/* Navigation: Month + Year selects */}
<div className="flex items-center gap-2 px-3 pb-2">
  <select
    value={getMonth(currentMonth)}
    onChange={(e) => setCurrentMonth(setMonth(currentMonth, Number(e.target.value)))}
    className="text-sm border rounded px-2 py-1 bg-popover"
  >
    {MONTHS_PT.map((m, i) => (
      <option key={i} value={i}>{m}</option>
    ))}
  </select>
  <select
    value={getYear(currentMonth)}
    onChange={(e) => setCurrentMonth(setYear(currentMonth, Number(e.target.value)))}
    className="text-sm border rounded px-2 py-1 bg-popover"
  >
    {YEARS.map((y) => (
      <option key={y} value={y}>{y}</option>
    ))}
  </select>
</div>
```

**Atualizar o `<Calendar>` para remover o `captionLayout` e usar `month`/`onMonthChange`:**
```tsx
<Calendar
  mode="range"
  selected={calendarSelected}
  onSelect={handleCalendarSelect}
  month={currentMonth}
  onMonthChange={setCurrentMonth}
  numberOfMonths={2}
  // captionLayout="dropdown-buttons" ← REMOVIDO
  // fromYear / toYear ← REMOVIDOS (não mais necessários sem captionLayout)
  disabled={...}
  className="pointer-events-auto"
/>
```

**Adicionar a lista de meses e anos:**
```typescript
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const YEARS = Array.from({ length: 8 }, (_, i) => 2020 + i); // 2020–2027
```

**Sincronizar `currentMonth` quando o `dateRange` mudar externamente** (ex: ao clicar em preset "Mês passado"):
```typescript
// No handlePresetClick, após onDateRangeChange:
setCurrentMonth(dates.from);

// No handleOpenChange (ao abrir):
if (open) setCurrentMonth(dateRange.from);
```

## Arquivo a Modificar

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/DateRangeFilter.tsx` | Remover `captionLayout`, adicionar estado `currentMonth`, adicionar selects de Mês/Ano no painel de inputs, sincronizar mês com presets e abertura do popover |

## O que NÃO muda

- Lógica de seleção de datas
- Inputs manuais DD/MM/AAAA
- Presets (Hoje, 7d, 30d, 90d, Este mês, Mês passado)
- Display do período selecionado
- Correção do NaN% (já funcional)
