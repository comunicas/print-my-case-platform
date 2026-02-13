

# Migrar Leads e Expandir Marketing

## Visao Geral

Mover a aba "Leads" de Settings para Marketing, adicionar analytics detalhado (grafico de leads por dia + cliques nos links curtos) e um card de "Leads" na MarketingOverview. O modulo de Marketing passara a ter 4 abas: **Cupons**, **Midias**, **Leads** e **Analytics**.

## Estrutura Final das Abas

```text
Marketing (sem tab) -> MarketingOverview com 4 cards
  ?tab=cupons  -> CouponsSettings (existente, sem mudanca)
  ?tab=midias  -> MediaSettings (existente, sem mudanca)
  ?tab=leads   -> CatalogLeadsSettings (movido de Settings)
  ?tab=analytics -> MarketingAnalytics (NOVO)
```

## Etapas

### Etapa 1: Mover Leads de Settings para Marketing

**Remover de Settings:**
- Remover lazy import, TabsTrigger e TabsContent de `CatalogLeadsSettings` em `src/pages/Settings.tsx`
- Remover `"leads"` de `ADMIN_ONLY_TABS`
- Voltar grid de `md:grid-cols-8` para `md:grid-cols-7`

**Adicionar em Marketing:**
- Adicionar lazy import de `CatalogLeadsSettings` em `src/pages/Marketing.tsx`
- Adicionar nova aba "Leads" no `TabsList` (com icone `UserPlus`)
- Adicionar `TabsContent` correspondente
- Visivel apenas para admins (`isAdmin`)

### Etapa 2: Atualizar MarketingOverview

Adicionar 2 novos cards na overview:

- **Leads**: "Visualize os leads capturados pelo catalogo publico" (icone `UserPlus`)
- **Analytics**: "Acompanhe metricas de desempenho do seu marketing" (icone `BarChart3`)

Grid passa de `md:grid-cols-2` para `md:grid-cols-2` (2x2 = 4 cards, mantendo 2 colunas).

Cards de Leads e Analytics visiveis apenas para admins.

### Etapa 3: Criar componente MarketingAnalytics

Novo componente `src/components/marketing/MarketingAnalytics.tsx` com:

**KPIs (4 cards):**
- Total de leads no periodo
- Total de cliques nos links curtos no periodo
- Taxa de conversao (leads / cliques, em %)
- Media de leads por dia

**Grafico 1 - Leads por dia (AreaChart):**
- Usando Recharts (mesmo padrao do Dashboard)
- Eixo X: dias, Eixo Y: quantidade de leads
- Dados da tabela `catalog_leads` agrupados por dia

**Grafico 2 - Cliques por dia (BarChart):**
- Dados da tabela `link_click_events` agrupados por dia
- Mostra quantos cliques os links curtos receberam

**Filtros:**
- DateRangeFilter (componente existente)
- PDVFilter (componente existente, ja disponivel na pagina Marketing)

### Etapa 4: Criar hook useMarketingAnalytics

Novo hook `src/hooks/useMarketingAnalytics.ts`:

- Recebe `dateFrom`, `dateTo`, `pdvId` como parametros
- Query 1: busca `catalog_leads` agrupando por dia (count por `created_at::date`)
- Query 2: busca `link_click_events` via join com `catalog_short_links` agrupando por dia
- Calcula KPIs: total leads, total cliques, taxa de conversao, media diaria
- Retorna dados formatados para os graficos Recharts

### Etapa 5: Atualizar exports e index

- Adicionar `MarketingAnalytics` em `src/components/marketing/index.ts`
- Nao precisa mexer em `src/components/settings/index.ts` (o export do CatalogLeadsSettings pode permanecer la sem impacto)

## Arquivos Modificados

| Arquivo | Tipo | Mudanca |
|---------|------|---------|
| `src/pages/Settings.tsx` | Editar | Remover aba Leads |
| `src/pages/Marketing.tsx` | Editar | Adicionar abas Leads e Analytics |
| `src/components/marketing/MarketingOverview.tsx` | Editar | Adicionar cards Leads e Analytics |
| `src/components/marketing/MarketingAnalytics.tsx` | Novo | Componente com KPIs e graficos |
| `src/hooks/useMarketingAnalytics.ts` | Novo | Hook de dados para analytics |
| `src/components/marketing/index.ts` | Editar | Adicionar export |

## Permissoes

- Abas "Leads" e "Analytics" visiveis apenas para `isAdmin` (org_admin e super_admin)
- Abas "Cupons" e "Midias" continuam visiveis para todos os papeis (com modo readonly para nao-admins)

## Riscos

- **BAIXO**: A unica mudanca destrutiva e remover a aba de Settings, mas o conteudo e o mesmo componente sendo renderizado em outro lugar
- Se um usuario tiver bookmark de `/settings?tab=leads`, nao encontrara mais (sera redirecionado para profile) - risco aceitavel
- Dados de `link_click_events` dependem do sistema de short links ja funcional

