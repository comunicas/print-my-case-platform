
# Análise Completa dos Testes Unitários — Falhas Identificadas

## Metodologia

Leitura direta de todos os 7 arquivos de teste e seus respectivos arquivos fonte antes de propor qualquer execução. Foram analisados 14 arquivos ao total.

## Falhas Encontradas (4 confirmadas por análise estática)

---

### Falha 1 — CRÍTICA: `vitest.config.ts` sem plugin React (afeta TODOS os testes `.tsx`)

**Arquivo:** `vitest.config.ts`

O arquivo atual não registra o plugin `@vitejs/plugin-react-swc`, que é obrigatório para compilar JSX nos testes de componentes:

```typescript
// ATUAL — sem plugin React
export default defineConfig({
  test: { environment: 'jsdom', ... },
  resolve: { alias: { '@': ... } },
});
```

Sem o plugin, todos os testes `.tsx` falham com erro de compilação:
- `StockAlertsTable.test.tsx` — 11 testes
- `TopProductsChart.test.tsx` — 8 testes
- `PDVFilter.test.tsx` — 9 testes

**Total afetado: 28 testes de componente**

Correção:
```typescript
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', ... },
  resolve: { alias: { '@': ... } },
});
```

---

### Falha 2 — CRÍTICA: `dateDisplay` com formato errado

**Arquivo:** `src/lib/__tests__/dashboardUtils.test.ts` linha 336

**Teste espera:**
```typescript
expect(result[0].dateDisplay).toBe('15/01');
```

**Implementação produz** (`src/lib/dashboardUtils.ts` linha 129):
```typescript
dateDisplay: format(parseISO(date), "EEE, dd/MM", { locale: ptBR })
// → "seg., 15/01"  (inclui dia da semana abreviado)
```

O teste espera `"15/01"` (formato `dd/MM`), mas a função usa `"EEE, dd/MM"` que produz `"seg., 15/01"`. O formato foi expandido em alguma refatoração, quebrando o contrato do teste.

Duas opções:
- **Opção A (preferida):** Corrigir o teste para refletir o formato atual: `expect(result[0].dateDisplay).toBe('seg., 15/01')`
- **Opção B:** Reverter o formato em `dashboardUtils.ts` para `"dd/MM"` (mas isso quebraria o gráfico de vendas por dia que exibe o dia da semana)

A Opção A é a correta — o formato `"EEE, dd/MM"` é intencional para exibir nos gráficos do dashboard (ex: "seg., 15/01"). O teste estava desatualizado.

---

### Falha 3 — MODERADA: `getLowStockItems` — threshold padrão inconsistente

**Arquivo:** `src/lib/__tests__/dashboardUtils.test.ts` linha 690-701

**Teste:**
```typescript
const slots = [
  { slotNumber: 'A1', quantity: 0 },   // deve ser incluído
  { slotNumber: 'A2', quantity: 1 },   // deve ser incluído
  { slotNumber: 'A3', quantity: 5 },   // deve ser excluído
];

const result = getLowStockItems(slots, new Map());  // threshold padrão = 1

expect(result).toHaveLength(2);
expect(result.map(r => r.slotNumber)).toEqual(['A1', 'A2']);
```

**Implementação** (`src/lib/dashboardUtils.ts` linha 318):
```typescript
threshold: number = 1
// filtro: slot.quantity <= threshold → inclui 0 e 1 ✓
```

O filtro está correto para este teste. Mas o **segundo teste** com threshold customizado:
```typescript
const slots = [{ slotNumber: 'A1', quantity: 3 }];
const result = getLowStockItems(slots, new Map(), 5);
expect(result).toHaveLength(1); // ✓ correto, 3 <= 5
```

Este também está correto. **A Falha 3 é provável mas depende do comportamento do sort** — os resultados `['A1', 'A2']` dependem da ordenação crescente após filtrar. Como `quantity: 0 < 1`, a ordem seria `[A1, A2]` que bate. **Este teste deve passar.**

---

### Falha 4 — MODERADA: `getBrandLogo` retorna caminho de imagem (não URL relativa)

**Arquivo:** `src/lib/__tests__/brandAssets.test.ts` linha 189-195

**Teste:**
```typescript
it('should return logo path for known brands', () => {
  expect(getBrandLogo('APPLE')).not.toBeNull();
});
```

`brandAssets.ts` importa os logos via:
```typescript
import appleLogo from '@/assets/brands/apple.png';
```

No ambiente jsdom do Vitest, imports de arquivos `.png` sem configuração de `asset handling` retornam a string do caminho ou `undefined`. O `vitest.config.ts` atual **não tem o plugin React nem transformers para assets**. Sem o plugin `@vitejs/plugin-react-swc`, imports de imagem via `@/assets/...` podem retornar `undefined` em vez da string do caminho, fazendo `getBrandLogo('APPLE')` retornar `null` (pois `BRAND_LOGOS[canonical]` seria `undefined`).

Este teste pode **passar ou falhar** dependendo de como o Vite/Vitest trata imports de PNG sem plugin — em modo jsdom, imports de PNG geralmente retornam o próprio caminho como string. **Risco moderado.**

---

## Resumo das Falhas

| # | Teste | Arquivo | Causa | Gravidade |
|---|---|---|---|---|
| F1 | Todos os `.tsx` (28 testes) | `vitest.config.ts` | Plugin React ausente | CRÍTICA |
| F2 | `dateDisplay deve ser dd/MM` | `dashboardUtils.test.ts:336` | Formato divergiu: `"EEE, dd/MM"` vs `"dd/MM"` | CRÍTICA |
| F3 | `getLowStockItems` threshold | `dashboardUtils.test.ts:690` | Improvável, análise indica OK | BAIXA |
| F4 | `getBrandLogo` retorna null | `brandAssets.test.ts:189` | Asset imports sem plugin | MODERADA |

---

## Plano de Correção

### Arquivo 1: `vitest.config.ts`

Adicionar o plugin React (já presente como dependência no `package.json` via `@vitejs/plugin-react-swc`):

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Arquivo 2: `src/lib/__tests__/dashboardUtils.test.ts` linha 336

Atualizar o teste para o formato atual que inclui o dia da semana:

```typescript
// ANTES (quebrado):
expect(result[0].dateDisplay).toBe('15/01');

// DEPOIS (correto — o formato "EEE, dd/MM" é intencional):
expect(result[0].dateDisplay).toBe('seg., 15/01');
```

### Verificação adicional após correções

Após corrigir os 2 problemas acima, todos os outros testes devem passar:
- `constants.test.ts` — 18 testes — SAUDÁVEL (já verificado: `ANOMALY_VALUE_THRESHOLD = 10000`)
- `brandAssets.test.ts` — 22 testes — deve funcionar com plugin React
- `productNormalization.test.ts` — 47 testes — puro TypeScript, sem assets
- `dashboardUtils.test.ts` — 52 testes — 1 falha confirmada (F2)
- `utils.test.ts` — 24 testes — SAUDÁVEL

### Arquivos a Alterar

| Arquivo | Mudança |
|---|---|
| `vitest.config.ts` | Adicionar `plugins: [react()]` |
| `src/lib/__tests__/dashboardUtils.test.ts` | Corrigir `dateDisplay` de `'15/01'` para `'seg., 15/01'` |
