
# Correção: Vincular perfil do usuário à organização

## Diagnóstico

O perfil do usuário `feahorita@gmail.com` tem dois problemas no banco de dados:

| Campo | Valor Atual | Valor Correto |
|---|---|---|
| `organization_id` | `NULL` | `56bf08d1-6843-43ef-a880-776acafe8609` (HB Solucoes Digitais) |
| `status` | `inactive` | `active` |

A organização **"HB Soluções Digitais"** existe e tem `owner_id` apontando corretamente para este usuário. Porém, o perfil nunca foi vinculado de volta — provavelmente porque a conta foi criada fora do fluxo padrão da Edge Function `create-user`, que é responsável por definir o `organization_id` no perfil.

Sem `organization_id`, todas as queries RLS retornam vazio (PDVs, vendas, estoque, notificações), e o hook `useOrganization` retorna `null`.

## Correção

Uma migration SQL para vincular o perfil a organização e ativar o status:

```sql
UPDATE profiles 
SET organization_id = '56bf08d1-6843-43ef-a880-776acafe8609', 
    status = 'active' 
WHERE id = '0f365ed3-f8b7-4d85-bb3b-54ca74be6c32';
```

Nenhuma mudança de codigo e necessaria. Apos a execucao, o usuario pode recarregar a pagina e todos os dados da organizacao serao carregados normalmente.

## Impacto

- Zero mudancas em arquivos de codigo
- 1 UPDATE no banco de dados
- Restaura acesso completo do usuario aos dados da organizacao "HB Solucoes Digitais"
