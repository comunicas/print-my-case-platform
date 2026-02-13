
# Catálogos Públicos por PDV

## Problema Atual
O sistema permite apenas **1 URL de catálogo por organização**. O slug e o PDV ficam na tabela `organizations`, impossibilitando ter URLs separadas para cada PDV (ex: `/catalogo/tiete-plaza` e `/catalogo/boulevard-tatuape`).

## Solução
Mover a configuração do catálogo público para a tabela `pdv_catalog_settings`, permitindo que cada PDV tenha seu próprio slug e URL independente.

## Mudanças Necessárias

### 1. Banco de Dados
- Adicionar coluna `public_slug` na tabela `pdv_catalog_settings` (unique, nullable)
- Adicionar coluna `is_public_enabled` na tabela `pdv_catalog_settings` (boolean, default false)
- Criar/atualizar a function `get_public_organization` para buscar por slug na `pdv_catalog_settings` ao invés de `organizations`
- Manter compatibilidade: se o slug existir na `organizations`, continuar funcionando (fallback)

### 2. Tela de Configuracao (OrganizationSettings)
- Substituir o bloco atual de "Catalogo Publico" (slug unico + PDV selector) por uma lista de PDVs, onde cada PDV pode:
  - Ativar/desativar seu catalogo publico individualmente
  - Ter seu proprio slug
  - Exibir seu link proprio

### 3. Function `get_public_organization`
- Primeiro busca o slug em `pdv_catalog_settings.public_slug`
- Se encontrar, retorna os dados do PDV e da organizacao associada
- Se nao encontrar, faz fallback para `organizations.public_slug` (compatibilidade)

### 4. Pagina Publica (PublicStock)
- Nenhuma mudanca necessaria na estrutura, pois ja recebe os dados via `get_public_organization`
- Os dados retornados terao o PDV correto baseado no slug

## Detalhes Tecnicos

### Migration SQL

```text
-- Novas colunas em pdv_catalog_settings
ALTER TABLE pdv_catalog_settings
  ADD COLUMN public_slug TEXT UNIQUE,
  ADD COLUMN is_public_enabled BOOLEAN DEFAULT false;

-- Migrar dados existentes da organizacao para o PDV configurado
UPDATE pdv_catalog_settings pcs
SET public_slug = o.public_slug,
    is_public_enabled = true
FROM organizations o
WHERE o.catalog_pdv_id = pcs.pdv_id
  AND o.public_catalog_enabled = true
  AND o.public_slug IS NOT NULL;

-- Se nao existe registro em pdv_catalog_settings para o PDV configurado, criar
INSERT INTO pdv_catalog_settings (pdv_id, public_slug, is_public_enabled)
SELECT o.catalog_pdv_id, o.public_slug, true
FROM organizations o
WHERE o.public_catalog_enabled = true
  AND o.catalog_pdv_id IS NOT NULL
  AND o.public_slug IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pdv_catalog_settings pcs WHERE pcs.pdv_id = o.catalog_pdv_id
  );

-- Atualizar function get_public_organization
-- Buscar primeiro em pdv_catalog_settings, fallback para organizations
```

### Componente OrganizationSettings
- Remover campos de slug unico e PDV selector
- Adicionar secao com lista de PDVs, cada um com toggle + campo de slug
- Usar o hook `usePDVCatalogSettings` existente (estender com novos campos)

### Hook usePDVCatalogSettings
- Estender para incluir `public_slug` e `is_public_enabled`
- Adicionar mutacao para salvar essas configs por PDV

## Resultado Final
- Cada PDV tera sua propria URL: `/catalogo/tiete-plaza`, `/catalogo/boulevard-tatuape`
- A UI mostrara todos os PDVs com seus respectivos toggles e slugs
- Compatibilidade mantida com a configuracao atual do Tiete Plaza
