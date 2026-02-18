
# Verificação dos Filtros da Página de Uploads

## Estado atual dos dados no banco

4 uploads presentes, todos com status `ready`:

| Arquivo | PDV | Tipo | Status | Registros |
|---|---|---|---|---|
| REVENUE-TIETE.xlsx | Tietê Plaza | sales | ready | 709 |
| REVENUE-TATUAPE.xlsx | Tatuapé | sales | ready | 103 |
| api-stock-2026-02-18 | Tietê Plaza | stock | ready | 140 |
| api-stock-2026-02-18 | Tatuapé | stock | ready | 85 |

## Problemas identificados na análise

### Problema 1 — Filtro de busca (search) não reseta a página — Bug de UX

**Arquivo:** `src/hooks/useUploads.ts` (linhas 103-111)

O filtro de busca textual é aplicado **client-side** sobre os resultados já paginados do banco:

```typescript
// Client-side após a query já paginada
if (search?.trim()) {
  const term = search.trim().toLowerCase();
  uploads = uploads.filter(
    (u) => u.pdv?.name?.toLowerCase().includes(term) ||
           u.file_name?.toLowerCase().includes(term) ||
           u.period?.toLowerCase().includes(term)
  );
}
```

**Consequência real hoje:** Com apenas 4 uploads isso não causa problema, mas o `totalCount` retornado **ignora o filtro de search** — ele conta tudo no banco sem aplicar o filtro textual. Ou seja, o componente de paginação mostraria "4 resultados" mesmo se o search filtrasse para 2 cards. Se o volume de uploads crescer (planilhas mensais acumuladas), isso vai gerar inconsistência entre o número exibido e os cards mostrados.

**Problema adicional:** Quando o usuário digita no campo de busca, a página atual não é resetada para 1. Se estiver na página 2 e buscar algo, o resultado pode parecer vazio mesmo havendo dados na página 1.

---

### Problema 2 — `totalCount` não reflete o filtro de search — Bug de contagem

**Arquivo:** `src/hooks/useUploads.ts` (linhas 66-74 vs 103-111)

A query de contagem (usada pelo paginador) aplica apenas filtros de `pdvId`, `type` e `status`. O filtro de `search` é client-side, mas o `totalCount` que alimenta o paginador não sabe quantos itens o search vai filtrar. Resultado: o rodapé de paginação mostra "4 uploads" mesmo com um search ativo que retornaria apenas 2 cards.

---

### Problema 3 — Filtros não resetam a página ao ser alterados — Bug de navegação

**Arquivo:** `src/pages/Uploads.tsx` (linhas 66-84)

Quando o usuário muda o filtro de PDV, tipo ou status enquanto está em uma página diferente da 1, ele permanece na mesma página. Se estava na página 3 e filtrar por "stock", que tem apenas 2 resultados (1 página), a query retorna `range(100, 149)` mas só existem 2 registros — o resultado fica vazio.

O `usePagination` não tem um efeito que reseta a página quando os filtros mudam. Precisa de um `pagination.setPage(1)` disparado nos handlers de filtro.

---

## Plano de correção

### Correção 1 — Resetar página ao mudar qualquer filtro

**Arquivo:** `src/pages/Uploads.tsx`

Nos handlers de cada filtro (`handlePdvChange`, `setFilterType`, `setFilterStatus`, `setSearchQuery`), chamar `pagination.setPage(1)` ao mudar o valor. Para isso, o `pagination` precisa ser acessível na página — que já é o caso via desestruturação de `useUploads`.

Como `pagination` é interno ao `useUploads`, a solução mais limpa é expor um callback `resetPage` e chamá-lo nos `onChange` dos filtros da página.

Alternativamente — e mais simples — incluir os filtros como dependências no `usePagination` via um `useEffect` dentro do `useUploads` que reage a mudanças nos filtros e reseta a página para 1.

### Correção 2 — Mover o filtro de search para server-side (parcialmente) e ajustar totalCount

**Arquivo:** `src/hooks/useUploads.ts`

Para `file_name` e `period`, o filtro pode ser feito server-side com `.ilike()`:

```typescript
if (search?.trim()) {
  const term = `%${search.trim()}%`;
  dataQuery = dataQuery.or(`file_name.ilike.${term},period.ilike.${term}`);
  countQuery = countQuery.or(`file_name.ilike.${term},period.ilike.${term}`);
}
```

O filtro por `pdv.name` não pode ser feito diretamente pois `pdv` é uma tabela relacionada. A solução é: manter o ilike server-side para `file_name` e `period`, e para busca por nome do PDV, aplicar client-side apenas quando o usuário já filtrou por PDV específico (o caso mais comum). Isso resolve a inconsistência do `totalCount`.

---

## Arquivos a serem alterados

| Arquivo | Mudança |
|---|---|
| `src/hooks/useUploads.ts` | Mover search de `file_name` e `period` para server-side; incluir search no countQuery; resetar página quando filtros mudam |
| `src/pages/Uploads.tsx` | Chamar reset de página nos handlers de filtro |

## Verificação atual (dados de hoje)

Com 4 uploads, todos `ready`, os filtros devem funcionar assim:

| Filtro aplicado | Resultado esperado | Resultado atual |
|---|---|---|
| PDV = Tietê | 2 cards (1 sales + 1 stock) | Correto (server-side eq) |
| Tipo = sales | 2 cards (REVENUE-TIETE + REVENUE-TATUAPE) | Correto (server-side eq) |
| Status = ready | 4 cards | Correto (server-side eq) |
| Status = processing | 0 cards, empty state | Correto |
| Busca = "tiete" | 1 card (REVENUE-TIETE.xlsx) | Funciona agora, mas totalCount errado |
| Busca = "Fev 2026" | 2 cards (ambos os revenue) | Funciona agora, mas totalCount errado |
| Busca = "api-stock" | 2 cards (ambos os stock) | Funciona agora, mas totalCount errado |

Os filtros de PDV, tipo e status estão **corretos** — são server-side com `.eq()`. Os problemas são no **search** (totalCount incorreto) e no **reset de página** (não há reset automático ao trocar filtros).
