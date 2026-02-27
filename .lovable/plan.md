
# Auto-selecionar PDV unico e ocultar filtro desnecessario

## Problema
Quando a organizacao tem apenas 1 PDV cadastrado, o filtro mostra "Todos os PDVs" como opcao, mas o resultado e identico ao de selecionar o unico PDV. Isso adiciona complexidade visual sem valor.

## Solucao
Quando `pdvs.length === 1`, o componente `PDVFilter` automaticamente:
1. Chama `onChange` com o ID do unico PDV (auto-selecao)
2. Oculta o seletor completamente, mostrando apenas o nome do PDV como texto estatico (sem interacao)

## Alteracoes

### 1. `src/components/ui/PDVFilter.tsx`
- Adicionar `useEffect` que detecta quando `pdvs.length === 1` e `value !== pdvs[0].id`, chamando `onChange(pdvs[0].id)` automaticamente
- Quando `pdvs.length <= 1`, renderizar apenas o nome do PDV como texto (sem Select, sem botoes de favorito)
- Manter o Select completo apenas quando `pdvs.length > 1`

### 2. `src/contexts/StockFiltersContext.tsx`
- Nenhuma alteracao necessaria — o contexto ja aceita qualquer valor de PDV

### 3. Testes
- Atualizar `src/components/ui/__tests__/PDVFilter.test.tsx` com caso de teste para PDV unico: verificar que `onChange` e chamado com o ID do PDV e que o Select nao e renderizado

## Detalhes tecnicos

```text
pdvs.length > 1:   [Select: Todos os PDVs | PDV A | PDV B] + botoes favorito
pdvs.length === 1: "PDV A" (texto simples, sem interacao)
pdvs.length === 0: nada renderizado
```

O `useEffect` de auto-selecao garante que paginas que dependem do `selectedPdv` (Dashboard, Financeiro, Marketing, Uploads, Estoque) recebam o ID correto mesmo sem interacao do usuario.
