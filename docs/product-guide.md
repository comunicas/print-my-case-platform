# Guia de produto

Atualizado em: **2026-04-30**

## Objetivo

A aplicação centraliza a operação de PDVs da Print My Case: estoque, vendas,
uploads, marketing, catálogo público, finanças, equipe, organizações e integrações.

## Login e sessão

- `/auth` concentra login, cadastro, recuperação de senha e atualização de senha.
- Rotas protegidas redirecionam usuários sem sessão para `/auth`.
- Após login, o app carrega perfil, role e organização ativa antes de mostrar as áreas operacionais.

## Dashboard

Rota: `/`

Mostra indicadores operacionais e financeiros por organização, PDV e período:

- Receita, transações, ticket médio, perdas, cancelamentos e reembolsos.
- Visão consolidada para perfis com acesso multi-organização.
- Gráficos de vendas, heatmap, produtos mais vendidos, estoque por marca e histórico.
- Alertas de baixo estoque com base em slots ativos e vendas recentes.
- Pull-to-refresh em mobile.

## Estoque

Rotas:

- `/estoque`: resumo de estoque.
- `/estoque/tabela`: tabela e mapa de slots.
- `/estoque/compras`: compras e pré-estoque.

Recursos principais:

- Busca unificada com autocomplete.
- Filtros por marca, status e PDV.
- Visualização em tabela e mapa de slots.
- Modal de detalhes do produto/slot.
- Pré-estoque e sugestões de alocação para compras.

## Uploads

Rotas:

- `/uploads`: listagem e criação de uploads.
- `/uploads/:id`: detalhes do upload.

Funcionalidades:

- Envio de planilhas de estoque e vendas.
- Filtros por arquivo, período, PDV, tipo e status.
- Paginação server-side para evitar inconsistência com filtros ativos.
- Processamento por Edge Function `process-spreadsheet`.
- Controle de exclusão para usuários autorizados.

## Marketing

Rota: `/marketing`

Abas:

- `cupons`: configuração de cupons por organização/PDV.
- `midias`: mídias promocionais disponíveis ou gerenciáveis.
- `catalogos`: configuração de catálogos públicos.
- `pedidos`: solicitações de produtos do catálogo.
- `vendas`: registros de venda usados pela operação.
- `leads`: leads capturados no catálogo.
- `analytics`: métricas de marketing.

Admins veem abas de configuração e gestão. Usuários sem permissão veem apenas
o que a role permitir.

## Catálogo público

Rotas:

- `/catalogo/:orgSlug`: catálogo por slug.
- `/s/:code`: link curto que redireciona para destino configurado.

Experiência pública:

- Busca por produto.
- Filtro por marca.
- Contador de modelos encontrados.
- Compartilhamento por Web Share API ou WhatsApp.
- Cópia de link.
- Localização do PDV com Google Maps e Waze.
- Formulário de solicitação de produto.
- Modal com código/QR code quando habilitado.
- Eventos de Facebook Pixel para visualização e lead.

## Financeiro

Rota: `/financeiro`

Abas:

- `Resumo`: KPIs mensais e comparativo entre PDVs.
- `DRE`: demonstrativo de resultado por mês e PDV.
- `Despesas`: criação, edição, exclusão e cópia de despesas do mês anterior.

Ações administrativas, como nova despesa e configuração de DRE, aparecem apenas
para perfis admin.

## Configurações

Rota: `/settings`

Abas:

- `profile`: dados do usuário.
- `preferences`: preferências pessoais, incluindo PDV padrão.
- `organization`: dados da organização.
- `pdvs`: cadastro e manutenção de PDVs.
- `team`: equipe e permissões, restrita a admins.
- `integrations`: API keys e integrações.

Usuários sem permissão que tentam acessar abas restritas são redirecionados para
perfil.

## Organizações

Rota: `/organizations`

Área voltada a super admins para visão e gestão multi-organização, incluindo
acessos cruzados e manutenção administrativa.

## Navegação e legado

O app mantém redirecionamentos para preservar links antigos:

- `/reports` redireciona para `/estoque`.
- `/vitrine` redireciona para `/marketing?tab=midias`.
- `/pdvs` redireciona para `/settings?tab=pdvs`.
- `/team` redireciona para `/settings?tab=team`.

Esses caminhos não devem receber novas telas.
