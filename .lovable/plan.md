

# Tela de Leads Capturados - Area Administrativa

## Resumo

Criar uma nova aba "Leads" na pagina de Settings (admin-only) para visualizar, filtrar e exportar os leads capturados pelo catalogo publico (tabela `catalog_leads`).

## Arquitetura

Seguir exatamente o padrao ja estabelecido por `ProductRequestsSettings` + `useProductRequests`:

1. **Hook de dados**: `useCatalogLeads.ts`
2. **Componente de listagem**: `CatalogLeadsSettings.tsx`
3. **Integrar na pagina Settings**: nova aba "Leads"

## Implementacao

### 1. Novo hook `src/hooks/useCatalogLeads.ts`

- Query principal com filtros: `dateFrom`, `dateTo`, `search` (busca por telefone ou produto)
- Query de stats: total de leads, leads hoje, leads na semana, top produto
- Mutation de delete (admin pode limpar leads)
- Exportar CSV: funcao utilitaria que converte os leads filtrados em CSV e faz download
- Usar `useDebounce` para o campo de busca (mesmo padrao de ProductRequests)

### 2. Novo componente `src/components/settings/CatalogLeadsSettings.tsx`

Layout seguindo `ProductRequestsSettings`:

**KPI Cards (4 cards)**:
- Total de leads
- Leads hoje
- Leads esta semana
- Top produto (produto mais solicitado)

**Filtros**:
- Campo de busca (telefone ou produto) com icone de Search
- Filtro de data com `DateRangeFilter` (componente ja existente no projeto)
- Botao "Exportar CSV" alinhado a direita

**Tabela (desktop)** com colunas:
- Data (formatada dd/MM/yyyy HH:mm)
- WhatsApp (com link para abrir wa.me)
- Produto
- Catalogo (slug)
- Acoes (abrir WhatsApp, excluir)

**Cards (mobile)**:
- Layout empilhado com telefone, produto, data e botao WhatsApp

**Delete com confirmacao**: AlertDialog antes de excluir (mesmo padrao).

**Empty state**: Icone + mensagem quando nao houver leads.

### 3. Atualizar `src/pages/Settings.tsx`

- Adicionar lazy import do `CatalogLeadsSettings`
- Adicionar nova aba "Leads" (admin-only, ao lado de "Pedidos")
- Adicionar "leads" ao array `ADMIN_ONLY_TABS`
- Usar icone `Users` ou `UserPlus` do lucide-react
- Grid de tabs passa de `md:grid-cols-7` para `md:grid-cols-8`

### 4. Atualizar `src/components/settings/index.ts`

- Exportar `CatalogLeadsSettings`

### 5. Funcao de exportacao CSV

Implementada direto no hook ou como utilitario no componente:
- Gera arquivo CSV com colunas: Data, WhatsApp, Produto, Catalogo
- Usa `encodeURIComponent` e `Blob` para download
- Nome do arquivo: `leads-catalogo-YYYY-MM-DD.csv`

## Arquivos modificados

| Arquivo | Tipo | Mudanca |
|---------|------|---------|
| `src/hooks/useCatalogLeads.ts` | Novo | Hook com queries, delete e export CSV |
| `src/components/settings/CatalogLeadsSettings.tsx` | Novo | Componente de listagem com filtros |
| `src/components/settings/index.ts` | Editar | Adicionar export |
| `src/pages/Settings.tsx` | Editar | Adicionar aba "Leads" |

## Riscos

- **NENHUM** para funcionalidade existente
- Tabela `catalog_leads` ja existe com RLS configurado (SELECT para admins, INSERT para anon)
- Nenhuma migration necessaria

