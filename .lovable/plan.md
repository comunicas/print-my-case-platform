

# Links Encurtados para Catálogos com Rastreamento

## Objetivo
Gerar um link curto dedicado para cada catálogo de PDV (ex: `printmycase.comunicas.com.br/s/abc123`) que redireciona para o catálogo completo e registra cada clique para análise de interação.

## Arquitetura

### 1. Banco de Dados

**Tabela `catalog_short_links`** - armazena os links curtos:
- `id` (uuid, PK)
- `pdv_id` (uuid, FK para pdvs)
- `short_code` (text, unique) - codigo curto de 6-8 caracteres
- `target_url` (text) - URL completa do catálogo
- `click_count` (integer, default 0) - contador rápido de cliques
- `created_at`, `updated_at`

**Tabela `link_click_events`** - log detalhado de cada clique:
- `id` (uuid, PK)
- `short_link_id` (uuid, FK)
- `clicked_at` (timestamptz)
- `referrer` (text, nullable)
- `user_agent` (text, nullable)
- `ip_hash` (text, nullable) - hash do IP para privacidade

**RLS:**
- Admins podem gerenciar `catalog_short_links` dos PDVs da sua org
- Leitura pública nos short links (para o redirect funcionar)
- Admins podem ver `link_click_events` dos seus links

### 2. Edge Function `redirect-short-link`

Uma edge function leve que:
1. Recebe o `short_code` via query param
2. Busca a URL de destino na tabela `catalog_short_links`
3. Registra o clique em `link_click_events` (async, sem bloquear)
4. Incrementa `click_count` na tabela
5. Retorna um redirect 302 para a URL do catálogo

### 3. Rota no App `/s/:code`

Uma rota React simples que:
1. Extrai o código curto da URL
2. Chama a edge function de redirect
3. Exibe um loader enquanto redireciona

### 4. UI - PDVCatalogList

Para cada PDV com catálogo ativo:
- Gerar automaticamente um short code ao salvar (se ainda nao existir)
- Exibir o link curto ao lado do link completo
- Botao de copiar o link curto
- Mostrar o contador de cliques ao lado do link

Layout atualizado de cada PDV:
```text
+------------------------------------------+
| Tiete Plaza Shopping          [Ativo] [x] |
| Av. Raimundo Pereira de Magalhaes        |
|                                          |
| Slug: /catalogo/tiete-plaza              |
|                                          |
| Link completo:                           |
| https://printmycase.../catalogo/tiete..  |
|                                          |
| Link curto:              42 cliques      |
| https://printmycase.../s/abc123  [copy]  |
|                                [Salvar]  |
+------------------------------------------+
```

### 5. Geração do Short Code

Função utilitária que gera códigos únicos de 6 caracteres alfanuméricos (base62). Verificação de unicidade no banco antes de salvar.

## Detalhes Técnicos

### Migration SQL
- Criar tabela `catalog_short_links` com unique constraint em `short_code`
- Criar tabela `link_click_events` com índice em `short_link_id`
- RLS policies para ambas as tabelas
- Função SQL `increment_click_count` para atomicidade

### Edge Function
- Path: `supabase/functions/redirect-short-link/index.ts`
- Usa service role key para inserir cliques (acesso anônimo)
- Resposta rápida com redirect 302

### Arquivos Modificados
- `src/components/settings/PDVCatalogList.tsx` - adicionar exibição do link curto e contador
- `src/hooks/usePDVCatalogSettings.ts` - incluir query dos short links e mutation para criar
- `src/App.tsx` - adicionar rota `/s/:code`
- Novo: `src/pages/ShortLinkRedirect.tsx` - página de redirect
- Novo: `supabase/functions/redirect-short-link/index.ts`

### Fluxo do Clique
1. Usuário acessa `printmycase.comunicas.com.br/s/abc123`
2. App carrega a rota `/s/:code`
3. Componente chama edge function com o código
4. Edge function registra o clique e retorna a URL de destino
5. Componente faz `window.location.replace(targetUrl)` para o catálogo

