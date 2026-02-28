

# Limpeza: Remover itens "Em breve" e usuario de teste

## 1. Remover cards "Em breve" da pagina de Integracoes

O arquivo `IntegrationsSettings.tsx` possui dois cards placeholder marcados como "Em breve":
- **Google Drive** (linhas 73-95): card desabilitado com badge "Em breve"
- **Webhooks** (linhas 292-313): card desabilitado com badge "Em breve"

Ambos serao removidos, mantendo apenas o card funcional de **API Keys**. Imports nao utilizados (`ExternalLink`, `Cloud`, `FileSpreadsheet`, `Badge`) tambem serao removidos.

## 2. Remover usuario de teste do banco de dados

O usuario **Viewer Teste** (`viewer.teste@printmycase.com`, ID: `40c6c368-956c-4298-ac7c-cbaa0b3e1363`) sera excluido via Edge Function `delete-user`, que ja existe e realiza hard delete no Auth (cascateando para `profiles`, `user_roles`, `preferences`, `user_pdvs`).

## Detalhes tecnicos

### Arquivo: `src/components/settings/IntegrationsSettings.tsx`
- Remover o card Google Drive (linhas 73-95)
- Remover o card Webhooks (linhas 292-313)
- Limpar imports nao utilizados: `Badge`, `ExternalLink`, `Cloud`, `FileSpreadsheet`

### Banco de dados
- Chamar a Edge Function `delete-user` com o ID `40c6c368-956c-4298-ac7c-cbaa0b3e1363` para excluir o usuario de teste de forma segura

