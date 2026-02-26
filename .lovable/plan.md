

# Criar Usuario Viewer de Teste

## Objetivo
Criar um usuario com role `viewer` vinculado a uma organizacao existente para testar as guardas de permissao implementadas (botao Upload oculto, API Keys ocultas, PDVs filtrados).

## Execucao

Invocar a edge function `create-user` ja existente com os seguintes dados:

| Campo | Valor |
|-------|-------|
| name | Viewer Teste |
| email | viewer.teste@printmycase.com |
| password | Viewer@Test2026! |
| role | viewer |
| createNewOrganization | false |
| organizationId | 56bf08d1-6843-43ef-a880-776acafe8609 (HB Solucoes Digitais) |

A funcao `create-user` requer autenticacao de um super_admin. A chamada sera feita via `supabase.functions.invoke` usando a sessao autenticada atual no preview.

## Apos a criacao

Com as credenciais acima, voce podera:
1. Fazer logout do usuario atual
2. Fazer login como `viewer.teste@printmycase.com` / `Viewer@Test2026!`
3. Verificar que:
   - O botao "Novo Upload" NAO aparece em /uploads
   - A secao de API Keys NAO aparece em /settings?tab=integrations
   - Apenas PDVs atribuidos aparecem em /settings?tab=pdvs

## Nenhuma alteracao de codigo necessaria
A criacao sera feita invocando a edge function existente — nao ha arquivos a modificar.

