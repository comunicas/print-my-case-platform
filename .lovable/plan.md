
# Fase 7 — Auditoria 100% do Frontend: Limpeza de Legados, Bugs e Conflitos

## Sumário Executivo

Foram lidos e analisados **todos** os arquivos do frontend: 10 páginas, 35+ hooks, 80+ componentes, 6 contextos, 15+ arquivos lib. A seguir o inventário completo com severidade de cada achado.

---

## Bugs Críticos (Quebram funcionalidade real)

### Bug 1 — Rota `tab=perfil` quebrada no AppHeader

**Arquivo:** `src/components/layout/AppHeader.tsx`, linha 100

```tsx
// ATUAL — aba "perfil" não existe no Settings.tsx
navigate("/settings?tab=perfil")

// CORRETO — o tab real chama-se "profile"
navigate("/settings?tab=profile")
```

**Impacto:** O menu "Meu Perfil" no dropdown do cabeçalho leva a `/settings?tab=perfil` que não corresponde a nenhuma aba definida no `Settings.tsx`. O `activeTab` cai para `"profile"` (fallback do `|| "profile"`), mas o comportamento é indeterminado e o usuário não vê o tab selecionado visualmente.

---

### Bug 2 — Rota `tab=notificacoes` inexistente no NotificationsPopover

**Arquivo:** `src/components/layout/NotificationsPopover.tsx`, linha 209

```tsx
// ATUAL — aba "notificacoes" não existe em Settings.tsx
navigate("/settings?tab=notificacoes")

// CORRETO — remover ou redirecionar para preferences onde ficam preferências
navigate("/settings?tab=preferences")
```

**Impacto:** Botão "Gerenciar preferências de notificação" no popover navega para uma aba inexistente.

---

### Bug 3 — Rota `tab=pedidos` e `tab=equipe` inconsistentes no NotificationsPopover

**Arquivo:** `src/components/layout/NotificationsPopover.tsx`, linhas 24 e 39

```tsx
// ATUAL — nomes errados
route: "/settings?tab=pedidos",  // linha 24
route: "/settings?tab=equipe",   // linha 39

// CORRETO — nomes reais definidos em Settings.tsx
route: "/settings?tab=requests", // corresponde ao TabsTrigger value="requests"
route: "/settings?tab=team",     // corresponde ao TabsTrigger value="team"
```

**Impacto:** Clicar em uma notificação de `product_request` ou `team_member` navega para abas que não existem.

---

### Bug 4 — `catalog_leads as any` — cast de tipo desnecessário

**Arquivo:** `src/components/public/ProductCodeModal.tsx`, linha 95

```tsx
// ATUAL — workaround desnecessário de tipo
await supabase.from("catalog_leads" as any).insert({...});

// CORRETO — a tabela está no schema gerado automaticamente
await supabase.from("catalog_leads").insert({...});
```

**Impacto:** Suprime o type-checking do Supabase SDK para esta operação, tornando-a invisível para o TypeScript em caso de mudanças de schema.

---

### Bug 5 — `err: any` sem tipagem em ProductCodeModal

**Arquivo:** `src/components/public/ProductCodeModal.tsx`, linha 73

```tsx
// ATUAL
} catch (err: any) {
  toast.error(err?.message || "Erro ao enviar código. Tente novamente.");

// CORRETO
} catch (err) {
  const message = err instanceof Error ? err.message : "Erro ao enviar código. Tente novamente.";
  toast.error(message);
```

---

### Bug 6 — NotFound em inglês (inconsistência crítica de idioma)

**Arquivo:** `src/pages/NotFound.tsx`

A única página em inglês da aplicação toda. Texto "Page not found" e "Return to Home" em app 100% em português.

```tsx
// ATUAL
<p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
<a href="/" className="text-primary underline hover:text-primary/90">Return to Home</a>

// CORRETO
<p className="mb-4 text-xl text-muted-foreground">Ops! Página não encontrada</p>
<a href="/" className="text-primary underline hover:text-primary/90">Voltar ao início</a>
```

---

## Código Morto / Legado

### Legado 1 — Constante duplicada: `MAX_SLOT_CAPACITY` vs `MAX_CAPACITY`

**Arquivos:** `src/lib/constants.ts` (linha 12) e `src/lib/stockTypes.ts` (linha 6)

Ambos definem a mesma constante com valor `7`:

```ts
// constants.ts
export const MAX_SLOT_CAPACITY = 7; // ← NUNCA IMPORTADA em nenhum arquivo

// stockTypes.ts
export const MAX_CAPACITY = 7; // ← USADA em stockUtils.ts, stockGridUtils.ts, ProductDetailModal.tsx
```

`MAX_SLOT_CAPACITY` em `constants.ts` é código morto — nunca foi importada em nenhum arquivo do projeto.

**Ação:** Remover `MAX_SLOT_CAPACITY` de `constants.ts`.

---

### Legado 2 — `PAGE_SIZE = 50` hardcoded dentro do hook vs `DEFAULT_PAGE_SIZE` em constants

**Arquivo:** `src/hooks/useUploads.ts`, linha 53

```ts
// ATUAL — número mágico duplicado
const PAGE_SIZE = 50;

// CORRETO — usar a constante centralizada
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
// ... usar DEFAULT_PAGE_SIZE no lugar de PAGE_SIZE
```

`DEFAULT_PAGE_SIZE = 50` já existe em `constants.ts` exatamente para isso.

---

### Legado 3 — `exportToExcel` usa `Record<string, any>[]` desnecessariamente

**Arquivo:** `src/lib/dashboardUtils.ts`, linha 471

```ts
// ATUAL — any desnecessário
export function exportToExcel(data: Record<string, any>[], filename: string)

// CORRETO
export function exportToExcel(data: Record<string, unknown>[], filename: string)
```

Função apenas repassa dados para XLSX — nenhum campo precisa de `any`.

---

### Legado 4 — `Record<string, any>` em SalesHeatmapChart e StockHistoryChart

**Arquivos:**
- `src/components/dashboard/SalesHeatmapChart.tsx`, linha 55-56
- `src/components/dashboard/StockHistoryChart.tsx`, linha 44

Ambos criam objetos `Record<string, any>` localmente para passar para `exportToExcel`. Com a correção do Legado 3, basta alterar para `Record<string, unknown>`.

---

## Conflitos de Navegação / Inconsistências de Rota

### Conflito 1 — Tabs do Settings com nomes inconsistentes entre arquivos

Mapeamento completo do estado atual:

| Tab real (Settings.tsx) | Rota errada usada |
|---|---|
| `profile` | `perfil` (AppHeader) |
| `requests` | `pedidos` (NotificationsPopover) |
| `team` | `equipe` (NotificationsPopover) |
| `preferences` | `notificacoes` (NotificationsPopover — destino errado) |

Todos os 4 casos corretos já identificados nos Bugs 1–3 acima.

---

## Outros Achados de Qualidade (Baixo Risco)

### Qualidade 1 — `hasActiveFilters` em `PublicStock.tsx` com tipo `string | null` em vez de `boolean`

**Arquivo:** `src/pages/PublicStock.tsx`, linha 122

```tsx
// ATUAL — truthy/falsy implícito, mas não boolean explícito
const hasActiveFilters = searchTerm || selectedBrand;

// CORRETO — boolean explícito
const hasActiveFilters = !!searchTerm || !!selectedBrand;
```

---

### Qualidade 2 — Animação CSS de badge não definida no Tailwind/CSS global

**Arquivo:** `src/components/ui/PDVFilter.tsx`, linhas 104-105

As classes `animate-badge-fade-in` e `animate-badge-fade-out` são usadas mas **não estão definidas** em `src/index.css` nem em `tailwind.config.ts`. Isso significa que a animação de entrada/saída do badge "Auto" nunca funciona — o badge simplesmente aparece e desaparece sem transição.

**Ação:** Adicionar as keyframes e utilitários no `tailwind.config.ts` ou `index.css`.

---

## Resumo dos Arquivos a Modificar

| Arquivo | Tipo de mudança | Severidade |
|---|---|---|
| `src/components/layout/AppHeader.tsx` | CORRIGIR `tab=perfil` → `tab=profile` | CRÍTICO |
| `src/components/layout/NotificationsPopover.tsx` | CORRIGIR 3 rotas de tabs (`pedidos`, `equipe`, `notificacoes`) | CRÍTICO |
| `src/components/public/ProductCodeModal.tsx` | CORRIGIR `as any` e `err: any` | MÉDIO |
| `src/pages/NotFound.tsx` | CORRIGIR textos para português | MÉDIO |
| `src/lib/constants.ts` | REMOVER `MAX_SLOT_CAPACITY` (código morto) | BAIXO |
| `src/hooks/useUploads.ts` | SUBSTITUIR `PAGE_SIZE = 50` por `DEFAULT_PAGE_SIZE` | BAIXO |
| `src/lib/dashboardUtils.ts` | CORRIGIR `Record<string, any>[]` → `Record<string, unknown>[]` | BAIXO |
| `src/components/dashboard/SalesHeatmapChart.tsx` | CORRIGIR `Record<string, any>` → `Record<string, unknown>` | BAIXO |
| `src/components/dashboard/StockHistoryChart.tsx` | CORRIGIR `Record<string, any>` → `Record<string, unknown>` | BAIXO |
| `src/pages/PublicStock.tsx` | CORRIGIR `hasActiveFilters` para boolean explícito | BAIXO |
| `tailwind.config.ts` ou `src/index.css` | ADICIONAR animações `badge-fade-in` / `badge-fade-out` | BAIXO |

**Total: 11 arquivos com 12 correções distintas, nenhuma envolve migrações de banco ou Edge Functions.**

---

## O que foi verificado e está CORRETO (sem alterações)

- Todas as páginas principais (Dashboard, Stock, Marketing, Settings, Organizations, Auth, PublicStock, UploadDetails, Uploads) — sem bugs estruturais
- `StockFiltersContext.tsx` — lógica correta, tipos corretos, clearFilters completo
- `useProductStock` — filtros, agregação, sales index — sem problemas
- `useNotifications` — polling, markAsRead, markAllAsRead, deleteNotification — corretos
- `useSlotsData` — query, transforms, `placeholderData` — correto
- `PDVFilter` — lógica de default, Auto badge, save/clear — correto (apenas animação CSS ausente)
- `useDefaultPdvPreference` — auto-apply, initialized flag — correto
- `AppLayout`, `AppSidebar`, `MobileSidebar` — navegação, collapsed, prefetch — corretos
- `AppHeader` — theme toggle, signOut, avatar, role labels — correto (exceto rota `tab=perfil`)
- `ProductModalContext` — lazy load, open/close — correto
- `ProductDetailModal` — tabs, analytics, slots, skeleton — correto
- Todos os `console.log` já removidos (busca retornou zero resultados)
- `src/index.css` — design system completo, dark mode, sem conflitos
- `src/lib/utils.ts` — `cn`, `formatCurrency`, `formatNumber`, `parseZodErrors`, `getInitials`, `pluralize` — sem duplicações
- `src/lib/trendUtils.ts` — correto
- `src/lib/stockTypes.ts`, `stockLabels.ts`, `stockViewModes.ts`, `stockGridUtils.ts` — corretos
- `NotFound.tsx` — estrutura correta, só i18n errado
- `ShortLinkRedirect.tsx` — correto
