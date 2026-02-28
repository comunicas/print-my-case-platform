

# Mover "Pedidos" de Configuracoes para Marketing

## Justificativa

"Pedidos de Produtos" sao demandas vindas do catalogo publico — uma funcionalidade de marketing/vendas. Mante-los em Configuracoes mistura gestao operacional com infraestrutura. Movendo para Marketing, temos:

- Cupons, Midias, Leads, **Pedidos**, Analytics — tudo relacionado ao catalogo publico num so lugar
- Configuracoes fica mais enxuta (6 abas em vez de 7)
- Fluxo mais intuitivo para o admin

## Mudancas Necessarias

### 1. Adicionar aba "Pedidos" na pagina Marketing (`src/pages/Marketing.tsx`)

- Importar `ProductRequestsSettings` via lazy loading (ja existe em `src/components/settings/ProductRequestsSettings.tsx`)
- Adicionar `TabsTrigger value="pedidos"` apos "Midias" (visivel apenas para admins, como Leads e Analytics)
- Adicionar `TabsContent value="pedidos"` com o componente
- Atualizar descricao do header: "Gerencie cupons, midias e pedidos dos seus PDVs"

### 2. Adicionar card "Pedidos" no MarketingOverview (`src/components/marketing/MarketingOverview.tsx`)

- Adicionar card com icone `MessageSquare` na lista de cards admin-only
- Texto: "Gerencie pedidos de produtos recebidos pelo catalogo publico"
- Navega para `tab=pedidos`

### 3. Adicionar sub-item no sidebar (`src/components/layout/AppSidebar.tsx`)

- Adicionar `{ label: "Pedidos", href: "/marketing?tab=pedidos" }` em `marketingSubItems`

### 4. Remover "Pedidos" da pagina Settings (`src/pages/Settings.tsx`)

- Remover lazy import de `ProductRequestsSettings`
- Remover `"requests"` de `ADMIN_ONLY_TABS`
- Remover `TabsTrigger value="requests"` e `TabsContent value="requests"`
- Ajustar grid de `grid-cols-7` para `grid-cols-6`

### 5. Atualizar rota de notificacoes (se existir)

- Verificar se ha links internos apontando para `/settings?tab=requests` e redirecionar para `/marketing?tab=pedidos`

## Arquivos a Editar

| Arquivo | Acao |
|---------|------|
| `src/pages/Marketing.tsx` | Adicionar aba Pedidos (admin-only) |
| `src/components/marketing/MarketingOverview.tsx` | Adicionar card Pedidos |
| `src/components/layout/AppSidebar.tsx` | Adicionar sub-item Pedidos |
| `src/pages/Settings.tsx` | Remover aba Pedidos, ajustar grid |

## Impacto

- **Zero mudanca no banco de dados** — os dados e RLS ficam identicos
- **Zero mudanca nos componentes** — `ProductRequestsSettings` e `ProductRequestDetailModal` permanecem onde estao, apenas importados de outro lugar
- **Rota antiga** (`/settings?tab=requests`) deixa de existir — nao ha deep links externos conhecidos

