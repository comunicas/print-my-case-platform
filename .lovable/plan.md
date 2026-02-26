

# Fase 2: Limpeza e Refatoracao do Dashboard (Index.tsx)

## Objetivo
Reduzir complexidade do arquivo Index.tsx (523 linhas) extraindo logica repetida, constantes e hooks auxiliares.

## Mudancas

### 1. Extrair constante `DEFAULT_KPIS` (src/pages/Index.tsx)

O objeto fallback nas linhas 208-223 sera movido para uma constante no topo do arquivo (fora do componente), evitando recriacao a cada render.

```text
const DEFAULT_KPIS = {
  totalRevenue: 0, grossRevenue: 0, totalRefunds: 0,
  refundedTransactions: 0, transactions: 0, avgTicket: 0,
  activePdvs: 0, previousRefunds: 0, totalCancellations: 0,
  cancelledTransactions: 0, previousCancellationsTotal: 0,
  previousRevenue: 0, previousTransactions: 0, previousAvgTicket: 0,
};
```

### 2. Extrair `effectivePdvId` em variavel reutilizavel

A expressao `selectedPdvId !== 'all' ? selectedPdvId : undefined` aparece 4 vezes (linhas 156, 157, 485, 506). Sera extraida para uma unica variavel `const effectivePdvId = selectedPdvId !== 'all' ? selectedPdvId : undefined` e reutilizada nos 4 pontos.

### 3. Criar hook `useLocalStorageState` (src/hooks/useLocalStorageState.ts)

Hook generico para persistir estado no localStorage, eliminando a duplicacao entre `dateRange` (linhas 62-96) e `consolidatedOpen` (linhas 80-88).

Interface:
```text
function useLocalStorageState<T>(key: string, defaultValue: T | (() => T), options?: {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
}): [T, (value: T | ((prev: T) => T)) => void, () => void]
```

- O terceiro retorno (`clear`) permite limpar o localStorage (usado no reset de dateRange)
- Serializers customizados para DateRange (toISOString/fromISOString)

### 4. Memoizar trends com `useMemo` (src/pages/Index.tsx)

As 5 chamadas a `calculateTrend` (linhas 229-265) serao agrupadas em um unico `useMemo` retornando um objeto com todas as trends:

```text
const trends = useMemo(() => ({
  revenue: calculateTrend(kpis.totalRevenue, kpis.previousRevenue, dateRange.from, dateRange.to),
  transactions: calculateTrend(kpis.transactions, kpis.previousTransactions, ...),
  refunds: calculateTrend(kpis.totalRefunds, kpis.previousRefunds, ...),
  cancellations: calculateTrend(kpis.totalCancellations, kpis.previousCancellationsTotal, ...),
  avgTicket: calculateTrend(kpis.avgTicket, kpis.previousAvgTicket, ...),
}), [kpis, dateRange.from, dateRange.to]);
```

**Nota**: As trends atualmente estao fora do bloco de return (apos o early return de loading), entao nao podem ser `useMemo` diretamente (hooks nao podem estar apos conditional returns). A solucao sera mover o early return de loading para dentro do JSX (render condicional) em vez de return antecipado, ou mover o calculo de trends para antes do early return.

### 5. Ajustar estrutura para permitir hooks antes do early return

Mover o bloco de loading (linhas 198-206) de early return para render condicional dentro do JSX, garantindo que todos os hooks rodem incondicionalmente (regra dos hooks). Isso tambem permite que `kpis`, `trends` e `effectivePdvId` sejam calculados com `useMemo`.

## Arquivos impactados

| Arquivo | Acao |
|---------|---------|
| `src/hooks/useLocalStorageState.ts` | Criar - hook generico de persistencia |
| `src/pages/Index.tsx` | Refatorar - usar useLocalStorageState, DEFAULT_KPIS, effectivePdvId, trends memoizados |

## Estimativa de reducao
- ~30-40 linhas removidas do Index.tsx (persistencia duplicada, expressoes repetidas)
- Codigo mais legivel e testavel
- Nenhuma mudanca visual ou funcional

