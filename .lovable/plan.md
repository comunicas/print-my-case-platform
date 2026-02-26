

# Refinamento do Modulo Financeiro - Linhas Individuais na DRE

## Problemas Identificados

1. **Filtro PDV nao aplicado nas despesas**: O `useDRE` chama `useFinancialEntries({ referenceMonth })` sem passar o `pdvId`, entao as despesas manuais nao sao filtradas por PDV quando o usuario seleciona um PDV especifico (ex: Tiete ou Boulevard Tatuape).

2. **Reembolsos automaticos nao aparecem como linha na DRE**: O valor de `refund_amount` dos `sales_records` e somado ao total de deducoes, mas nao aparece como uma linha expandivel na DRE. O usuario nao consegue ver de onde vem cada valor.

3. **Formulario nao reseta ao alternar entre editar/novo**: O `useForm` usa `defaultValues` que nao se atualizam quando `editEntry` muda (comportamento do react-hook-form). Precisa de `useEffect` com `reset()`.

4. **Lista de despesas nao filtra por PDV**: O `useFinancialEntries` na pagina `Financeiro.tsx` tambem nao recebe `pdvId`.

## Alteracoes Planejadas

### 1. `useFinancialEntries.ts` - Aceitar filtro por PDV

Adicionar parametro opcional `pdvId` ao hook. Quando informado, filtrar as entries por `pdv_id = pdvId` OU `pdv_id IS NULL` (despesas gerais se aplicam a todos os PDVs).

### 2. `useDRE.ts` - Passar pdvId e expor reembolsos como linha

- Passar `pdvId` para `useFinancialEntries`
- Criar uma entrada virtual "Reembolsos / Cancelamentos" no array `entriesByCategory.deducoes` quando houver reembolsos automaticos, para que apareca como linha expandivel na DRE

### 3. `DRETable.tsx` - Refinar visual

- Adicionar margem de separacao visual entre secoes
- Mostrar quantidade de itens no badge do trigger expandivel
- Melhorar indentacao das linhas filhas

### 4. `FinancialEntryForm.tsx` - Reset ao trocar modo

Adicionar `useEffect` que chama `form.reset(...)` quando `editEntry` ou `open` mudam, garantindo que o formulario sempre reflita o estado correto.

### 5. `Financeiro.tsx` - Passar pdvId para entries

Passar o `pdvId` filtrado tanto para `useDRE` quanto para `useFinancialEntries`.

## Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useFinancialEntries.ts` | Adicionar filtro por `pdvId` |
| `src/hooks/useDRE.ts` | Passar `pdvId` para entries + criar linha virtual de reembolsos |
| `src/components/financeiro/DRETable.tsx` | Refinar visual com contagem de itens e separacao |
| `src/components/financeiro/FinancialEntryForm.tsx` | Adicionar `useEffect` com `form.reset()` |
| `src/pages/Financeiro.tsx` | Passar `pdvId` para `useFinancialEntries` |

## Detalhes Tecnicos

**Linha virtual de reembolsos no `useDRE.ts`:**
```typescript
// Criar entrada virtual para reembolsos automaticos
const reembolsoEntry = {
  id: "auto-refunds",
  description: "Reembolsos / Cancelamentos",
  amount: deducoesAuto,
  category: "deducoes",
  // ... campos restantes com valores dummy
};
```

Isso permite que o `ExpandableRow` da DRE mostre tanto os reembolsos automaticos (vindos de `sales_records`) quanto as deducoes manuais (CMV, STONE) como linhas individuais dentro da secao "Deducoes da Venda".

**Filtro PDV no `useFinancialEntries`:**
```typescript
if (pdvId) {
  query = query.or(`pdv_id.eq.${pdvId},pdv_id.is.null`);
}
```

Despesas sem PDV (gerais) continuam aparecendo quando um PDV especifico e selecionado.

