

# Limpeza de Legados e Placeholders nas Tabs de Configuracoes

## Problemas Identificados

### 1. Tab Organizacao (`Settings.tsx`)

**Card "Plano e Faturamento" (linhas 147-179):** Possui dois botoes desabilitados ("Gerenciar Plano" e "Ver Faturas") que nao levam a lugar nenhum. Nao existe sistema de billing implementado.

**Card "PDVs Ativos" (linhas 181-218):** Redundante -- ja existe uma tab dedicada "PDVs" com CRUD completo. Este card mostra apenas os 5 primeiros PDVs ativos e um link "Ver todos os PDVs" que redireciona para a tab PDVs.

**Acao:** Remover ambos os cards. Manter apenas o componente `OrganizationSettings` que ja exibe o badge do plano na header.

### 2. Tab Integracoes (`Settings.tsx`)

**Card "Backend (Lovable Cloud)" (linhas 243-264):** Card estatico que apenas mostra "Conectado" e um botao "Configurado" desabilitado. Informacao interna irrelevante para o usuario.

**Acao:** Remover o card e limpar os imports nao utilizados (`Cloud`, `ExternalLink`).

### 3. Tab Equipe (`TeamSettings.tsx`)

**Botao "Adicionar Membro" para org_admin (linhas 266-278):** Botao desabilitado com tooltip "Em breve: sistema de convites por email". Placeholder sem funcionalidade.

**Acao:** Remover o bloco do botao desabilitado para org_admin, mantendo apenas o botao "Criar Usuario" para super_admin.

### 4. Tab Preferencias (`PreferencesSettings.tsx`)

**Seletor de idioma (linhas 122-139):** Oferece Ingles e Espanhol mas o app e 100% em portugues, sem sistema de i18n. Salva no banco mas nao faz nada.

**Acao:** Remover o seletor de idioma.

**Toggles de notificacoes (linhas 143-223):** Os 4 switches (email, alertas de estoque, relatorios semanais, uploads processados) salvam no banco mas nenhuma notificacao por email e disparada de fato. As notificacoes in-app existem, mas os toggles nao controlam nada.

**Acao:** Remover o card inteiro de Notificacoes. Quando o sistema de email for implementado no futuro, pode ser recriado.

### 5. Tab Perfil (`ProfileSettings.tsx`)

**Botao "Alterar foto" (linha 141):** Desabilitado sem funcionalidade de upload de avatar implementada.

**Acao:** Remover o botao e o texto "JPG, PNG ou GIF. Maximo 2MB." Manter apenas o avatar com as iniciais.

---

## Detalhes Tecnicos

### Arquivo: `src/pages/Settings.tsx`
- Remover card "Plano e Faturamento" (linhas 147-179)
- Remover card "PDVs Ativos" (linhas 181-218)
- Remover card "Backend (Lovable Cloud)" (linhas 243-264)
- Limpar imports nao utilizados: `ExternalLink`, `Cloud`, `Loader2` (se nao usado em outro lugar), `Badge` (verificar uso restante)

### Arquivo: `src/components/settings/PreferencesSettings.tsx`
- Remover seletor de idioma (linhas 122-139)
- Remover card de Notificacoes inteiro (linhas 143-223)

### Arquivo: `src/components/settings/TeamSettings.tsx`
- Remover bloco do botao desabilitado "Adicionar Membro" para org_admin (linhas 266-278)

### Arquivo: `src/components/settings/ProfileSettings.tsx`
- Remover botao "Alterar foto" e texto auxiliar (linhas 140-148)
- Limpar import `Camera`

