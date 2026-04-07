

## Mover "Vendas" de Financeiro para Marketing

### Resumo

Remover a tab "Vendas" do Financeiro (restaurando-o ao estado original com Resumo, DRE, Despesas) e adicioná-la ao módulo Marketing como nova tab.

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Financeiro.tsx` | Remover import `SalesRecordsTab`, remover TabsTrigger e TabsContent de "vendas" |
| `src/pages/Marketing.tsx` | Import lazy de `SalesRecordsTab`, adicionar TabsTrigger "Vendas" e TabsContent |
| `src/components/marketing/MarketingOverview.tsx` | Adicionar card "Vendas" na overview |
| `src/components/layout/AppSidebar.tsx` | Adicionar sub-item `{ label: "Vendas", href: "/marketing?tab=vendas" }` em `marketingSubItems` |
| `src/components/layout/MobileSidebar.tsx` | Mesmo: adicionar "Vendas" em `marketingSubItems` |

### Detalhes

**Financeiro** volta a ter apenas 3 tabs: Resumo, DRE, Despesas. Remove-se o import de `SalesRecordsTab` e as linhas 131, 216-219.

**Marketing** ganha a tab "vendas" após "pedidos". O `SalesRecordsTab` recebe `pdvs` e `canUpload={isAdmin}` já disponíveis no contexto da página.

**Sidebar**: `marketingSubItems` passa de `[Cupons, Mídias, Pedidos]` para `[Cupons, Mídias, Pedidos, Vendas]`.

