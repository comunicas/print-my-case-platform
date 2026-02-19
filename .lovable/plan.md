
# Persistência do Filtro de Datas no Dashboard (localStorage)

## Diagnóstico do Estado Atual

Em `src/pages/Index.tsx`:

- `dateRange` é inicializado com `getDateRangeFromPeriod("30days")` (linha 60) — sempre reseta ao navegar.
- `prefsInitialized` guard (linha 82-94) **sobrescreve** o dateRange com `preferences.default_period` na primeira carga — esse é o conflito central a resolver.
- Já existe um padrão idêntico de persistência em localStorage para `dashboard-consolidated-open` (linhas 65-73), que serve como referência direta.
- **Não existe** nenhum hook dedicado para persistência de dateRange.

## Estratégia de Persistência

### Serialização no localStorage

Datas não podem ser serializadas diretamente como `Date` objects em JSON. A estratégia usada será salvar as datas como **ISO strings** e restaurar parseando com `new Date()`:

```json
// Chave: 'dashboard-date-range'
{
  "from": "2026-01-20T03:00:00.000Z",
  "to": "2026-02-19T02:59:59.999Z"
}
```

### Ordem de Prioridade (da mais para menos prioritária)

```text
1. localStorage (última seleção do usuário na sessão/entre sessões)
2. preferences.default_period  ← aplica SOMENTE se não há nada salvo
3. fallback hardcoded "30days"  ← só se nenhum dos anteriores existir
```

Isso garante que a preferência do servidor (`default_period`) ainda é respeitada no **primeiro acesso** do usuário, mas visitas subsequentes restauram a seleção manual.

### Validação do Valor Restaurado

Antes de aplicar o valor do localStorage, validar:
- Estrutura `{ from, to }` existe
- Ambas as datas são válidas (`!isNaN(date.getTime())`)
- Datas são razoáveis (não no futuro extremo, não antes de 2015)

Se inválido → ignora e aplica `default_period` das preferências.

## Mudanças Necessárias

### Arquivo único: `src/pages/Index.tsx`

**1. Inicialização do `useState` de `dateRange` (linha 60)**

Ler o localStorage **na inicialização** do estado (dentro da função lazy do `useState`), para evitar flash do valor padrão:

```typescript
// ANTES (linha 60):
const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPeriod("30days"));

// DEPOIS:
const [dateRange, setDateRange] = useState<DateRange>(() => {
  try {
    const saved = localStorage.getItem('dashboard-date-range');
    if (saved) {
      const parsed = JSON.parse(saved);
      const from = new Date(parsed.from);
      const to = new Date(parsed.to);
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        return { from, to };
      }
    }
  } catch {}
  return getDateRangeFromPeriod("30days");
});
```

**2. Atualizar o guard de preferências (linhas 81-94)**

O bloco `prefsInitialized` atualmente **sempre** sobrescreve `dateRange` com `default_period`. Isso deve ser condicional — só aplica se **não havia nada salvo no localStorage**:

```typescript
// ANTES:
useEffect(() => {
  if (!prefsInitialized && preferences && !isLoadingPreferences && !pdvsLoading) {
    setDateRange(getDateRangeFromPeriod(preferences.default_period));  // sempre sobrescreve
    // ...
    setPrefsInitialized(true);
  }
}, [...]);

// DEPOIS:
useEffect(() => {
  if (!prefsInitialized && preferences && !isLoadingPreferences && !pdvsLoading) {
    // Só aplica default_period se não há preferência salva no localStorage
    const hasSavedRange = !!localStorage.getItem('dashboard-date-range');
    if (!hasSavedRange) {
      setDateRange(getDateRangeFromPeriod(preferences.default_period));
    }
    // resto do bloco (PDV) permanece igual
    // ...
    setPrefsInitialized(true);
  }
}, [...]);
```

**3. Salvar no localStorage quando `dateRange` muda**

Adicionar `useEffect` análogo ao do `consolidatedOpen`:

```typescript
// Adicionar após o useEffect do consolidatedOpen (linha 73):
useEffect(() => {
  localStorage.setItem('dashboard-date-range', JSON.stringify({
    from: dateRange.from.toISOString(),
    to: dateRange.to.toISOString(),
  }));
}, [dateRange]);
```

## Comportamento Resultante

```text
PRIMEIRO ACESSO (sem localStorage):
  → aplica preferences.default_period (ex: "7days")
  → salva no localStorage

VISITAS SUBSEQUENTES:
  → restaura do localStorage (ex: range customizado "01/01 - 15/02")
  → ignora preferences.default_period

PREFERÊNCIA ALTERADA EM SETTINGS:
  → só terá efeito se o usuário limpar manualmente o localStorage
    (comportamento esperado — a seleção manual tem prioridade)

RANGE INVÁLIDO NO LOCALSTORAGE (dado corrompido):
  → ignora silenciosamente, cai no fallback "30days"
```

## O Que NÃO Muda

- `DateRangeFilter` — zero alterações no componente
- `useDashboard`, `useDashboardDataRange` — sem toque
- `usePreferences` — sem toque
- Lógica de PDV — sem toque
- Outros hooks e páginas — nenhum impacto

## Arquivos a Modificar

| Arquivo | Mudanças |
|---|---|
| `src/pages/Index.tsx` | (1) Lazy initializer do `useState<DateRange>` lê localStorage; (2) Guard de preferências condicionado à ausência de localStorage; (3) `useEffect` que salva dateRange no localStorage |

Total: **3 alterações cirúrgicas em 1 arquivo**, sem novos arquivos, sem novos imports, sem migrações.
