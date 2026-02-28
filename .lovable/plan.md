
# Mover Catalogos para o modulo Marketing

## Situacao Atual

O gerenciamento de catalogos publicos (`PDVCatalogList`) esta embutido dentro da tab **Organizacao** em Configuracoes. Isso inclui:
- Configuracao de slugs publicos por PDV
- Links curtos com contagem de cliques
- Toggle de ativacao/desativacao

Isso nao faz sentido em "Organizacao" -- catalogos sao ferramentas de marketing, assim como cupons, midias e leads.

## Mudancas Propostas

### 1. Nova aba "Catalogos" no modulo Marketing

Adicionar uma nova tab `catalogos` entre as tabs existentes, visivel apenas para admins. Ela exibira o componente `PDVCatalogList` ja existente, com filtro por PDV (aproveitando o `PDVFilter` ja presente na pagina).

### 2. Remover catalogos da tab Organizacao

Remover o bloco `PDVCatalogList`, o `Separator` e o import do componente em `OrganizationSettings.tsx`. A tab Organizacao ficara focada apenas nos dados cadastrais.

### 3. Atualizar o overview do Marketing

Adicionar um card "Catalogos" no `MarketingOverview` para que admins vejam a opcao na pagina inicial do modulo.

---

## Detalhes Tecnicos

### Arquivo: `src/pages/Marketing.tsx`
- Adicionar nova tab `catalogos` no `TabsList` (restrita a admins)
- Adicionar `TabsContent` com `PDVCatalogList` passando `organizationId` e filtrando por `selectedPdvId`
- Lazy import do `PDVCatalogList`

### Arquivo: `src/components/settings/OrganizationSettings.tsx`
- Remover import do `PDVCatalogList`
- Remover o bloco JSX do Separator + secao "Catalogos Publicos" (linhas 173-189)
- Remover import do `Separator` (nao utilizado em outro lugar do arquivo)

### Arquivo: `src/components/marketing/MarketingOverview.tsx`
- Adicionar card "Catalogos" com icone `Globe` e descricao sobre configuracao de URLs publicas por PDV
- Posicionar entre "Midias" e "Pedidos" na lista de cards

### Memoria de rotas
- Adicionar `catalogos` a lista de tabs do Marketing
