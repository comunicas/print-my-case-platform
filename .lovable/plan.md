
# Fix: Tipagem correta do `prefetchMap` sem cast desnecessário

## Diagnóstico do Problema

**Arquivo afetado:** `src/components/layout/AppSidebar.tsx`, linha 84

```typescript
// ATUAL — cast enganoso:
const handlePrefetch = prefetchMap[item.href as keyof typeof prefetchMap];
```

**Por que é um problema:**

O `prefetchMap` possui apenas 4 entradas: `"/"`, `"/organizations"`, `"/estoque"`, `"/marketing"`. Mas `navItems` inclui `"/uploads"`, que **não está** no mapa.

O cast `as keyof typeof prefetchMap` instrui o TypeScript a tratar `item.href` (uma `string` arbitrária) como se fosse uma das 4 chaves válidas. O TypeScript então **não avisa** que `/uploads` nunca terá prefetch — o tipo inferido é `() => void` em vez de `(() => void) | undefined`, ocultando o comportamento real.

Em runtime, `prefetchMap["/uploads"]` retorna `undefined`, que é passado como `onMouseEnter={undefined}` — inofensivo, mas o TypeScript não sabe disso. A solução é usar um acesso tipado que expressa honestamente que o resultado pode ser `undefined`.

---

## Solução: Tipagem honesta com acesso via record tipado

A correção usa um acesso tipado explícito que permite `undefined` sem precisar de cast:

```typescript
// DEPOIS — tipagem honesta:
const prefetchHandlers: Partial<Record<string, () => void>> = prefetchMap;
const handlePrefetch = prefetchHandlers[item.href];
```

**Alternativa mais compacta (mesma semântica):**

```typescript
const handlePrefetch = (prefetchMap as Partial<Record<string, () => void>>)[item.href];
```

Ambas fazem o mesmo: o tipo de `handlePrefetch` passa a ser `(() => void) | undefined`, que é o comportamento real. O JSX `onMouseEnter={handlePrefetch}` aceita `(() => void) | undefined` sem erro — nenhuma outra mudança é necessária.

---

## Por que não adicionar `/uploads` ao `prefetchMap`?

O plano original (item #7) descartou essa opção: uploads é uma listagem simples sem dados pesados para pré-carregar. Adicionar um `prefetchUploads` vazio só para "completar" o mapa adicionaria código sem valor. A solução correta é tornar o lookup honestamente opcional.

---

## Mudanças Necessárias

### `src/components/layout/AppSidebar.tsx` — 1 linha alterada

**Linha 84:**

```typescript
// ANTES:
const handlePrefetch = prefetchMap[item.href as keyof typeof prefetchMap];

// DEPOIS:
const handlePrefetch = (prefetchMap as Partial<Record<string, () => void>>)[item.href];
```

Nenhuma outra mudança. O `onMouseEnter={handlePrefetch}` já aceita `undefined` na prop do React — zero impacto em runtime, tipagem agora expressa a realidade.

---

## Resumo

| Arquivo | Linha | Mudança |
|---|---|---|
| `src/components/layout/AppSidebar.tsx` | 84 | Substituir cast `as keyof typeof prefetchMap` por acesso via `Partial<Record<string, () => void>>` |

**1 arquivo, 1 linha, zero risco de regressão.**
