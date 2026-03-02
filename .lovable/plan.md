
# Adicionar verificacao de duplicatas no "copiar despesas do mes anterior"

## Problema

A mutacao `copyFromPreviousMonth` nao verifica se ja existem entradas no mes de destino. Se o usuario clicar duas vezes (ou o botao nao desabilitar a tempo), as despesas sao duplicadas.

## Solucao

Antes de inserir as copias, verificar se ja existem entradas com categorias "fixas" ou "deducoes" no mes de destino. Se existirem, abortar com mensagem amigavel.

### Alteracao em `src/hooks/useFinancialEntries.ts`

Na `mutationFn` de `copyFromPreviousMonth`, logo apos calcular `targetMonthStr` (linha ~140), adicionar uma query que verifica se ja existem entradas no mes de destino:

```typescript
// Verificar se ja existem entradas copiadas no mes de destino
let checkQuery = supabase
  .from("financial_entries")
  .select("id", { count: "exact", head: true })
  .eq("reference_month", targetMonthStr)
  .in("category", ["fixas", "deducoes"]);

if (orgId) {
  checkQuery = checkQuery.eq("organization_id", orgId);
}

const { count, error: checkError } = await checkQuery;
if (checkError) throw checkError;
if (count && count > 0) {
  throw new Error("Ja existem despesas neste mes. Exclua-as antes de copiar novamente.");
}
```

Isso fica antes da query que busca as entradas do mes anterior (linha ~142), garantindo que a operacao e abortada antes de qualquer insert.

## Impacto

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useFinancialEntries.ts` | ~10 linhas: verificacao de duplicatas antes do insert |

Nenhuma migration necessaria. A mensagem de erro aparecera como toast vermelho caso o usuario tente copiar duas vezes.
