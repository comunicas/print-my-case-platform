

# Fase 9: Deduplicacao do AppSidebar e adocao do useLocalStorageState

## Problema

1. **AppSidebar.tsx (395 linhas)**: `renderStockMenu` e `renderMarketingMenu` sao funcoes quase identicas (~85 linhas cada) que diferem apenas em: icone, label, subitens, estado de expansao e prefetch handler. Isso viola DRY e dificulta manutencao.

2. **Uso inconsistente de localStorage**: O hook `useLocalStorageState` foi criado na Fase 2 mas existem 3 arquivos que ainda usam `localStorage` diretamente com o mesmo padrao boilerplate:
   - `StockGridView.tsx` - viewMode (compact/expanded)
   - `ActiveOrgContext.tsx` - active-org-id
   - `useSidebarPreferences.ts` - 3 valores (collapsed, stockExpanded, marketingExpanded) — porem esse hook sincroniza com DB via `updatePreferences`, entao nao e candidato direto

## Mudancas

### 1. Extrair componente `CollapsibleNavMenu` do AppSidebar

Criar um componente reutilizavel que recebe:

```text
interface CollapsibleNavMenuProps {
  icon: React.ElementType;
  label: string;
  href: string;
  subItems: { label: string; href: string }[];
  collapsed: boolean;
  isActive: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onNavigate: (href: string) => void;
  onPrefetch?: () => void;
  activeItem: string;
  defaultSubTab?: string;
}
```

Isso substitui `renderStockMenu` e `renderMarketingMenu` por duas chamadas ao mesmo componente, eliminando ~70 linhas duplicadas.

### 2. Migrar StockGridView para useLocalStorageState

Substituir o padrao manual de `useState` + `localStorage.getItem/setItem` + `useEffect` por `useLocalStorageState('stock-view-mode', 'expanded')`. Remove ~8 linhas de boilerplate.

### 3. Migrar ActiveOrgContext para useLocalStorageState

Substituir `localStorage.getItem/setItem('active-org-id')` por `useLocalStorageState('active-org-id', '')`. Remove ~5 linhas de boilerplate.

**Nota**: `useSidebarPreferences.ts` NAO sera migrado porque ele sincroniza localStorage com o banco de dados via `updatePreferences.mutate()`. A logica bidirecional (DB -> localStorage e localStorage -> DB) nao se encaixa no padrao simples do `useLocalStorageState`.

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/components/layout/AppSidebar.tsx` | Refatorar - extrair CollapsibleNavMenu, reduzir ~70 linhas |
| `src/components/stock/StockGridView.tsx` | Refatorar - usar useLocalStorageState para viewMode |
| `src/contexts/ActiveOrgContext.tsx` | Refatorar - usar useLocalStorageState para active-org-id |

## Beneficios
- Elimina duplicacao significativa no sidebar
- Padroniza acesso ao localStorage em toda a codebase
- Facilita adicao de novos menus collapsiveis (basta adicionar mais uma chamada ao componente)
- Nenhuma mudanca visual ou funcional

