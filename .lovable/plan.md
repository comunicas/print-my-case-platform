
# Mover botao "Copiar despesas" da aba DRE para a aba Despesas

## Alteracao

Mover o card "Nenhuma despesa neste mes / Copiar despesas" (linhas 143-164) da `TabsContent value="dre"` para a `TabsContent value="despesas"`, logo apos o componente `FinancialEntriesList`.

O card continuara visivel apenas quando: usuario e admin, nao esta carregando, e nao existem entries no mes selecionado.

## Arquivo modificado

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Financeiro.tsx` | Remover bloco do card de copia da aba DRE (linhas 143-164) e inserir o mesmo bloco na aba Despesas, apos o `FinancialEntriesList` (apos linha 176) |

Nenhuma outra alteracao necessaria -- a logica, imports e estado ja estao no mesmo componente.
