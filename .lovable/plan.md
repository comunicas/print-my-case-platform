
# Autocomplete de descricao no formulario de despesa

## O que sera feito

Substituir o campo de texto simples "Descricao" no formulario de nova despesa por um **combobox com autocomplete** que sugere descricoes ja utilizadas anteriormente na mesma categoria. O usuario podera selecionar uma sugestao existente ou digitar uma descricao nova livremente.

## Abordagem

Usar um Popover + Command (cmdk) para criar um combobox inline, similar ao padrao ja existente no projeto. Quando o usuario foca no campo, aparece uma lista de sugestoes filtradas pela categoria selecionada. Ao digitar, a lista filtra em tempo real.

## Alteracoes

### 1. Novo hook: `src/hooks/useFinancialDescriptions.ts`

Query dedicada que busca descricoes distintas da tabela `financial_entries`, filtradas por categoria e organizacao. Retorna um array de strings unicas, ordenadas alfabeticamente.

```typescript
// Query: SELECT DISTINCT description FROM financial_entries
//   WHERE organization_id = orgId AND category = category
//   ORDER BY description
```

- Usa `useQuery` com queryKey `["financial-descriptions", orgId, category]`
- Habilitado apenas quando `category` e `orgId` estao definidos

### 2. Atualizar `src/components/financeiro/FinancialEntryForm.tsx`

- Importar o novo hook `useFinancialDescriptions`
- Importar `Popover`, `PopoverTrigger`, `PopoverContent` e componentes `Command`
- Observar o valor atual de `category` via `form.watch("category")`
- Chamar `useFinancialDescriptions({ category })`
- Substituir o `<Input>` do campo descricao por um combobox:
  - Input editavel que permite digitacao livre (nao e um select fechado)
  - Popover que abre ao focar mostrando sugestoes filtradas
  - Ao selecionar uma sugestao, preenche o campo e fecha o popover
  - Ao digitar texto novo (sem selecionar), o valor digitado e mantido normalmente
- Estado local `popoverOpen` controla visibilidade da lista de sugestoes

### Comportamento esperado

1. Usuario seleciona categoria (ex: "Despesas Fixas")
2. Ao clicar no campo descricao, aparece lista com descricoes ja usadas nessa categoria (ex: "Aluguel", "Internet", "Energia")
3. Ao digitar, a lista filtra em tempo real
4. Pode selecionar uma sugestao (preenche o campo) ou digitar algo totalmente novo
5. Campo continua validando normalmente (minimo 1 caractere, maximo 200)

## Detalhes tecnicos

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/hooks/useFinancialDescriptions.ts` | Novo | Hook que busca descricoes distintas por categoria |
| `src/components/financeiro/FinancialEntryForm.tsx` | Alterado | Campo descricao vira combobox com sugestoes |

Nenhuma migration de banco necessaria -- a query usa dados ja existentes na tabela `financial_entries`.
