
# Code Review: Remoção de Legados, Código Morto e Inconsistências

## Diagnóstico Executivo

Após leitura direta de 40+ arquivos, identifiquei **4 categorias de problemas reais** com evidências concretas de código e localização exata. O estado geral é saudável (314 testes passando, filtros server-side, RLS implementado), mas há acúmulo de código morto e constantes fantasma que aumentam a carga cognitiva e podem induzir erros futuros.

---

## Categoria 1 — Constantes Sem Consumidores Reais ("Fantasy Constants")

Existem 5 constantes exportadas em `src/lib/constants.ts` que **só são referenciadas pelos próprios testes** (`constants.test.ts`). Nenhum arquivo funcional as importa.

| Constante | Valor | Única referência fora do teste |
|---|---|---|
| `MAX_SLOT_CAPACITY` | 7 | Apenas `constants.test.ts` |
| `LOW_STOCK_THRESHOLD` | 2 | Apenas `constants.test.ts` |
| `REDISTRIBUTE_THRESHOLD` | 5 | Apenas `constants.test.ts` |
| `STOCK_HISTORY_DAYS` | 90 | Apenas `constants.test.ts` |
| `CHART_ANIMATION_DELAY_STEP` | 50 | Apenas `constants.test.ts` |

O valor real `MAX_CAPACITY = 7` vive em `src/lib/stockTypes.ts` (canônico) e é importado por `stockUtils.ts`, `stockGridUtils.ts` e `ProductDetailModal.tsx`. A constante `MAX_SLOT_CAPACITY = 7` em `constants.ts` é um **duplicado morto** — mesmo valor, sem consumidores.

O mesmo vale para `LOW_STOCK_THRESHOLD` e `REDISTRIBUTE_THRESHOLD`: os thresholds reais vivem hardcoded em `stockUtils.ts` linhas 12-14 (`if (quantity <= 2) return 'restock'; if (quantity <= 5) return 'redistribute'`) e em `STOCK_THRESHOLDS` em `stockTypes.ts`.

`STOCK_HISTORY_DAYS = 90` nunca é importado — o valor está hardcoded em `Index.tsx` linha 114: `.days: 90`.

`CHART_ANIMATION_DELAY_STEP = 50` nunca é usado em nenhum componente.

**Ação:** Remover as 5 constantes de `constants.ts` e remover suas referências de `constants.test.ts`.

---

## Categoria 2 — Interfaces Legadas Sem Consumidores ("Dead Types")

Em `src/lib/schemas/upload.ts` existem duas interfaces que **nunca são importadas** por nenhum arquivo funcional:

```typescript
// src/lib/schemas/upload.ts — linha 84
export interface Upload { ... }  // Nunca importada

// src/lib/schemas/upload.ts — linha 102
export interface UploadWithRelations extends Upload { ... }  // Nunca importada
```

Os hooks usam suas próprias interfaces locais (`UploadListItem` em `useUploads.ts`, `UploadDetails` em `useUploadDetails.ts`) que são as **fontes canônicas** para as queries com joins. A interface `Upload` foi provavelmente o design original antes da divisão em hooks especializados. O comentário de hierarquia no topo do arquivo já documenta isso, mas as interfaces permanecem como código morto.

**Ação:** Remover `Upload` e `UploadWithRelations` de `schemas/upload.ts`. Remover também o campo `pdv_name?` de `Upload` que é resíduo do design antigo.

---

## Categoria 3 — Função Duplicada com Contrato Diferente (`calculatePercentageChange`)

Existe uma função com o mesmo nome em dois arquivos com **comportamentos diferentes**:

**`src/lib/dashboardUtils.ts` linha 354:**
```typescript
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return 0;  // retorna 0 quando anterior é zero
  return ((current - previous) / previous) * 100;  // sem arredondamento
}
```

**`src/lib/trendUtils.ts` linha 17:**
```typescript
export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) return null;  // retorna null quando anterior é zero
  return Math.round(((current - previous) / previous) * 1000) / 10;  // 1 casa decimal
}
```

Diferenças concretas:
- Tipo de retorno: `number` vs `number | null`
- Comportamento com zero: retorna `0` vs retorna `null`
- Precisão: sem arredondamento vs 1 casa decimal

`dashboardUtils.ts` usa sua versão internamente em `calculateKPIs`. `trendUtils.ts` usa a sua versão em `calculateTrend` (usada por `Index.tsx` via `KPICard`). São dois sistemas paralelos com nomes idênticos.

**Problema real:** `useDashboard.ts` calcula `cancellationsChange` diretamente (sem usar nenhuma das duas funções), e os testes de `dashboardUtils.test.ts` testam apenas a versão de `dashboardUtils`. A duplicação cria confusão sobre qual versão usar em novos contextos.

**Ação:** Renomear a versão em `dashboardUtils.ts` para `calculateRawPercentage` (nome interno, não exportada, ou mantida interna sem exportação pública). A versão em `trendUtils.ts` permanece como a API pública. Alternativamente, unificar via parâmetro de opções.

---

## Categoria 4 — `DEFAULT_PAGE_SIZE` Duplicada

A constante `DEFAULT_PAGE_SIZE = 50` existe em dois lugares:

- `src/lib/constants.ts` linha 7: exportada, usada apenas em `constants.test.ts`
- `src/hooks/usePaginatedQuery.ts` linha 24: local, usada internamente pelo hook

O hook não importa de `constants.ts` — define sua própria cópia. Se alguém mudar a constante em `constants.ts`, o hook não é afetado.

**Ação:** Fazer `usePaginatedQuery.ts` importar `DEFAULT_PAGE_SIZE` de `constants.ts` em vez de redefinir localmente.

---

## Resumo das Mudanças

| # | Arquivo | Mudança | Impacto |
|---|---|---|---|
| 1 | `src/lib/constants.ts` | Remover 5 constantes fantasma | -5 exports mortos |
| 2 | `src/lib/__tests__/constants.test.ts` | Remover testes das 5 constantes removidas | -~12 testes sem cobertura real |
| 3 | `src/lib/schemas/upload.ts` | Remover `Upload` e `UploadWithRelations` | -2 interfaces mortas |
| 4 | `src/lib/dashboardUtils.ts` | Tornar `calculatePercentageChange` interna (não exportada) | Elimina duplicação de API |
| 5 | `src/hooks/usePaginatedQuery.ts` | Importar `DEFAULT_PAGE_SIZE` de `constants.ts` | Unifica fonte de verdade |
| 6 | `src/pages/Index.tsx` linha 114 | Substituir `days: 90` por `STOCK_HISTORY_DAYS` da constante (após reativar) | Código autodocumentado |

**Exceção para item 6:** Se a constante `STOCK_HISTORY_DAYS` for reativada (removida do plano 1) para uso real em `Index.tsx`, ela deixa de ser código morto. Neste caso: manter a constante e conectá-la ao único local que a usa. Esta é a abordagem preferida para `STOCK_HISTORY_DAYS` — em vez de remover, **conectar ao uso real**.

## Arquivos a Alterar

```text
src/lib/constants.ts              → Remover: MAX_SLOT_CAPACITY, LOW_STOCK_THRESHOLD,
                                    REDISTRIBUTE_THRESHOLD, CHART_ANIMATION_DELAY_STEP
                                    Manter: STOCK_HISTORY_DAYS (será conectado ao uso real)

src/lib/__tests__/constants.test.ts → Remover blocos de teste das 4 constantes removidas

src/lib/schemas/upload.ts         → Remover interface Upload e UploadWithRelations

src/lib/dashboardUtils.ts         → Remover export de calculatePercentageChange
                                    (manter a função como interna/não exportada)

src/hooks/usePaginatedQuery.ts    → Importar DEFAULT_PAGE_SIZE de '@/lib/constants'
                                    em vez de redefinir localmente

src/pages/Index.tsx               → Substituir hardcode days: 90 por STOCK_HISTORY_DAYS
```

## O que NÃO será alterado

- Nenhuma lógica de negócio
- Nenhum componente visual
- Nenhuma edge function
- Nenhuma tabela do banco
- Nenhuma política RLS

Todas as mudanças são puramente de organização de código — remover exports não consumidos, unificar fontes duplicadas, eliminar tipos fantasma.
