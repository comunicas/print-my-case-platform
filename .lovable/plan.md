
# Code Review: Sidebar e Mobile Menu

## Problemas Encontrados

### 1. Inconsistência Crítica de Rotas — `MobileSidebar.tsx`

**Organizações aponta para `/organizacoes` (com cedilha) mas a rota real é `/organizations`:**

```typescript
// MobileSidebar.tsx linha 39 — ERRADO:
{ icon: Building2, label: "Organizações", href: "/organizacoes", superAdminOnly: true },

// App.tsx linha 70 — a rota real:
<Route path="/organizations" element={...} />

// AppSidebar.tsx linha 36 — correto:
{ icon: Building2, label: "Organizações", href: "/organizations", superAdminOnly: true },
```

Isso significa que clicar em "Organizações" no mobile levaria para uma página 404.

---

### 2. Settings ausente no AppSidebar mas presente no MobileSidebar

O `MobileSidebar` tem um `bottomNavItems` com "Configurações" → `/settings`, mas o `AppSidebar` não tem nenhuma entrada para Settings visível na navegação lateral desktop. Os usuários desktop acessam Settings apenas pelo dropdown do avatar no header.

Essa assimetria de funcionalidade entre mobile e desktop não é necessariamente um bug, mas é uma inconsistência de UX que pode ser alinhada — Settings pode ser adicionado como item de rodapé no AppSidebar (abaixo do botão "Recolher") para paridade.

---

### 3. Código morto/legado em `useSidebarPreferences.ts`

O comentário na linha 5 revela uma key de localStorage legada:

```typescript
const STORAGE_KEY_STOCK = "sidebar-reports-expanded"; // Keep same key for backwards compatibility
```

O nome `reports` refere-se ao sistema anterior (antes de renomear para "Estoque"). O comentário "backwards compatibility" indica que nunca foi limpo. Como o dado é apenas um booleano simples, não há risco real de migração — pode ser renomeado para `sidebar-stock-expanded`.

Além disso, `marketingExpanded` é salvo apenas no `localStorage` mas **não persiste no banco de dados** (linha 57-58):
```typescript
const updateMarketingExpanded = useCallback((value: boolean) => {
  setMarketingExpanded(value);
  localStorage.setItem(STORAGE_KEY_MARKETING, String(value));
  // Marketing expanded is only stored locally for now  ← comentário legado
}, []);
```
Isso é inconsistente com `stockExpanded` e `collapsed`, que sincronizam com o banco. Pode ser adicionada a persistência via `updatePreferences`.

---

### 4. Span invisible no AppSidebar quando collapsed (código morto)

No `renderStockMenu` e `renderMarketingMenu`, quando o sidebar está expandido, existe a classe:
```typescript
collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
```
Porém, quando `collapsed=true`, a função retorna um branch totalmente diferente (o botão com tooltip, sem o `CollapsibleTrigger`). Portanto, essa lógica de `collapsed` dentro do `CollapsibleTrigger` nunca é executada quando `collapsed=true` — é **código morto**. A span com `collapsed ? "opacity-0 w-0 overflow-hidden"` dentro do Collapsible pode ser simplificada.

---

### 5. `AppHeader` — rota de perfil incorreta

```typescript
// AppHeader.tsx linha 100 — ERRADO:
onClick={() => navigate("/settings?tab=perfil")}

// A rota correta (conforme memory routing-tab-naming-convention):
// ?tab= deve ser "profile" em inglês
```

A memória do projeto documenta explicitamente que as chaves de aba são em inglês: `profile`, `preferences`, `organization`, `pdvs`, `team`, `requests`. O link "Meu Perfil" usa `?tab=perfil` (em português), que não existe.

---

### 6. Redundância do botão X no MobileSidebar

O `SheetContent` do Radix UI já inclui um botão de fechar por padrão. O `MobileSidebar` adiciona um segundo botão X manualmente, criando dois botões de fechar visíveis simultaneamente. O botão nativo do Sheet pode ser suprimido com `hideClose` ou o manual pode ser removido — mas atualmente **ambos aparecem**, o que é redundante.

---

### 7. `prefetchMap` não cobre `/uploads`

```typescript
// usePrefetchRoutes.ts linha 150-155:
const prefetchMap = useMemo(() => ({
  "/": prefetchDashboard,
  "/organizations": prefetchOrganizations,
  "/estoque": prefetchStock,
  "/marketing": prefetchMarketing,
}), [...]);
```

No `AppSidebar`, quando `renderNavItem` é chamado para o item "Uploads" (`href: "/uploads"`), ele tenta:
```typescript
const handlePrefetch = prefetchMap[item.href as keyof typeof prefetchMap];
```
Para `/uploads`, `handlePrefetch` é `undefined`. Isso é passado como `onMouseEnter={undefined}`, o que não causa erro mas desperdiça a cast de tipo desnecessária.

---

## Resumo das Correções

| # | Arquivo | Problema | Correção |
|---|---|---|---|
| 1 | `MobileSidebar.tsx` | Rota `/organizacoes` (404) | Corrigir para `/organizations` |
| 2 | `AppSidebar.tsx` + `MobileSidebar.tsx` | Settings ausente no desktop | Adicionar Settings no rodapé do AppSidebar |
| 3 | `useSidebarPreferences.ts` | Key legada `sidebar-reports-expanded` + marketing não persiste no DB | Renomear key; persistir marketingExpanded |
| 4 | `AppSidebar.tsx` | Código morto: `collapsed ?` dentro do Collapsible (branch nunca atingido) | Remover condicionais de collapsed dentro dos branches do Collapsible |
| 5 | `AppHeader.tsx` | `?tab=perfil` (PT) deve ser `?tab=profile` (EN) | Corrigir para `/settings?tab=profile` |
| 6 | `MobileSidebar.tsx` | Botão X duplicado (manual + nativo do Sheet) | Remover o botão X manual, usar o nativo via prop `closeButton` do Sheet |
| 7 | `usePrefetchRoutes.ts` | `/uploads` sem prefetch no map | Sem ação necessária (não causa erro, mas pode-se adicionar `prefetchUploads` se quiser) |

## Arquivos a Modificar

| Arquivo | Mudanças |
|---|---|
| `src/components/layout/MobileSidebar.tsx` | (1) Corrigir href de `/organizacoes` → `/organizations`; (2) Remover botão X manual |
| `src/components/layout/AppSidebar.tsx` | (3) Adicionar item Settings no rodapé; (4) Remover código morto de collapsed no Collapsible |
| `src/components/layout/AppHeader.tsx` | (5) Corrigir `?tab=perfil` → `?tab=profile` |
| `src/hooks/useSidebarPreferences.ts` | (6) Renomear key legada; (7) Persistir marketingExpanded no banco |

Total: **4 arquivos**, todas correções cirúrgicas sem novos componentes, sem banco de dados, sem novos imports.
