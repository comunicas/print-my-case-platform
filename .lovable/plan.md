
# Verificação de Persistência + Botão de Reset do Filtro de Datas

## Verificação de Persistência — Resultado

A persistência foi testada com sucesso:

1. Selecionado o preset **7d** no dashboard → filtro exibiu "12/02 - 18/02 (7 dias)"
2. Navegado para `/stock`
3. Voltado para `/` (dashboard)
4. Resultado: **7d mantido**, dados corretos restaurados sem flash

A implementação do `localStorage` está funcionando perfeitamente.

---

## Botão de Reset — Análise e Design

### Comportamento Esperado

O botão de reset deve:
1. Remover a chave `dashboard-date-range` do `localStorage`
2. Aplicar o `preferences.default_period` do servidor (ex: "30days")
3. Ser discreto — não deve poluir visualmente a barra de filtros

### Onde Colocar o Reset

O botão de reset deve existir em **`Index.tsx`**, não no `DateRangeFilter`. O motivo: o `DateRangeFilter` é um componente genérico (reutilizado em outros contextos), e não tem acesso a `preferences` nem ao `localStorage`. O reset é uma responsabilidade da página que gerencia o estado.

A `DateRangeFilter` recebe uma prop opcional `onReset` — quando fornecida, exibe um ícone de reset ao lado do período exibido.

### Interface Visual

```
[ Hoje ] [ 7d ] [ 30d ] [ 90d ] [ Este mês ] [ Mês passado ] [ 📅 v ]    12/02 - 18/02 (7 dias)  •  Dados: 05/12 - 18/02  Ver tudo   ↺
                                                                                                                                       ^
                                                                                                                                  ícone RotateCcw
                                                                                                                            "Restaurar período padrão"
```

O ícone `RotateCcw` aparece **apenas quando o filtro atual difere do período padrão das preferências** (`default_period`). Isso evita exibir um botão desnecessário quando o usuário já está no período padrão.

---

## Mudanças Necessárias

### 1. `src/components/dashboard/DateRangeFilter.tsx`

Adicionar prop `onReset?: () => void` à interface. Quando fornecida, renderizar um botão com ícone `RotateCcw` no bloco "Period Info":

```tsx
// Adicionar à interface DateRangeFilterProps:
onReset?: () => void;

// Adicionar no JSX, ao final do bloco "Period Info" (após o "Ver tudo"):
{onReset && (
  <Button
    variant="ghost"
    size="sm"
    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
    onClick={onReset}
    title="Restaurar período padrão"
  >
    <RotateCcw className="h-3.5 w-3.5" />
  </Button>
)}
```

Adicionar `RotateCcw` ao import existente de `lucide-react`.

### 2. `src/pages/Index.tsx`

Adicionar função `handleResetDateRange`:

```tsx
const handleResetDateRange = () => {
  localStorage.removeItem('dashboard-date-range');
  const defaultRange = getDateRangeFromPeriod(preferences?.default_period ?? "30days");
  setDateRange(defaultRange);
};
```

Passar a prop para o `DateRangeFilter`:

```tsx
// ANTES:
<DateRangeFilter
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  dataRange={...}
/>

// DEPOIS:
<DateRangeFilter
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  dataRange={...}
  onReset={handleResetDateRange}
/>
```

O botão de reset **sempre aparece** quando `onReset` é passado, mantendo a implementação simples. O usuário pode clicar nele a qualquer momento para voltar ao período padrão das preferências.

---

## Comportamento Resultante

```
USUÁRIO SELECIONA "7d" MANUALMENTE:
  → salvo no localStorage
  → ícone ↺ visível ao lado do período

USUÁRIO CLICA ↺:
  → localStorage.removeItem('dashboard-date-range')
  → setDateRange(getDateRangeFromPeriod(preferences.default_period))
  → dashboard atualiza imediatamente para o período padrão
  → ao navegar e voltar, o padrão é reaplicado (sem localStorage)

PREFERÊNCIA PADRÃO = "30days" → CLICA ↺:
  → mesmo comportamento: remove localStorage, aplica "30d"
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/DateRangeFilter.tsx` | (1) Import `RotateCcw`; (2) Prop `onReset?` na interface; (3) Botão reset no JSX |
| `src/pages/Index.tsx` | (1) Função `handleResetDateRange`; (2) Prop `onReset` no `<DateRangeFilter>` |

Total: **2 arquivos, 5 mudanças pequenas**, sem novos arquivos, sem novos imports de hooks, sem banco de dados.
