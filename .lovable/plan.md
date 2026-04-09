

## Correções: Filtro URL + Busca Unificada

### Problema 1: `?status=restock` não é aplicado
O `StockFiltersContext` não lê query params da URL. Quando o usuário clica "Repor" no Resumo e navega para `/estoque/tabela?status=restock`, o filtro de status permanece em `'all'`.

### Problema 2: Busca inconsistente entre páginas
- **Estoque (Tabela)**: Usa `ProductSearchAutocomplete` (refatorado, com debounce, highlight, clear button)
- **Compras (PreStockTab)**: Usa `SearchFilter` (básico, sem debounce, sem clear)
- **Uploads, SalesRecords, Organizations**: Também usam `SearchFilter` básico

### Solução

**1. StockFiltersContext — ler `?status=` da URL no mount**

Adicionar um efeito no `StockFiltersProvider` que lê `window.location.search` na inicialização e aplica o valor de `status` ao estado. Isso é one-shot (apenas na montagem), para não sobrescrever interações do usuário depois.

```
// Na inicialização, antes do efeito de preferências:
const urlParams = new URLSearchParams(window.location.search);
const urlStatus = urlParams.get('status');
// Se urlStatus é válido (restock, warning, perfect, monitor), 
// setar como estado inicial do statusFilter
```

Modificar o `defaultState` para ser calculado dinamicamente a partir da URL.

**2. SearchFilter — upgrade para versão com debounce e clear**

Refatorar `src/components/ui/SearchFilter.tsx` para incluir:
- Debounce de 300ms (usando `useDebounce`)
- Botão X para limpar
- Spinner durante debounce
- Mesma API externa (`value`, `onChange`, `placeholder`, `className`)

Isso atualiza automaticamente todas as 4 páginas que usam `SearchFilter` (Uploads, SalesRecords, PreStockTab, Organizations) sem alterar nenhuma delas.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/contexts/StockFiltersContext.tsx` | Ler `?status=` da URL como estado inicial do `statusFilter` |
| `src/components/ui/SearchFilter.tsx` | Adicionar debounce, clear button, spinner — mesma interface pública |

### Resultado
- Clicar "Repor" no Resumo → Tabela abre já filtrada por status restock
- Todas as buscas têm debounce, clear button e feedback visual consistente

