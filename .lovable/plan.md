

## Remover "Configurações" Duplicado do Menu Lateral

### Resultado dos Testes Mobile

- **Navegação Resumo → Tabela → Compras**: Funcionando corretamente. O menu fecha ao selecionar qualquer item e navega para a rota correta.
- **URLs corretas**: `/estoque`, `/estoque/tabela`, `/estoque/compras`

### Problema Identificado

"Configurações" aparece em **dois lugares**:
1. No rodapé do menu lateral (tanto mobile quanto desktop)
2. No dropdown do perfil no header (ícone de engrenagem + "Configurações")

O acesso pelo header já é suficiente e mais intuitivo — o rodapé do menu fica redundante.

### Mudanças

**`src/components/layout/MobileSidebar.tsx`**
- Remover `Settings` do import de lucide-react
- Remover a entrada `{ icon: Settings, label: "Configurações", href: "/settings" }` do array `bottomNavItems`
- Se `bottomNavItems` ficar vazio (apenas Organizações que é condicional), simplificar: renderizar apenas o item de Organizações quando `isSuperAdmin`, sem a seção `border-t` separada quando não há itens

**`src/components/layout/AppSidebar.tsx`**
- Remover todo o bloco de Configurações do footer (linhas 194-226 — o botão collapsed com tooltip e o botão expandido)
- Manter apenas o botão de "Recolher/Expandir" no footer
- Remover `Settings` do import de lucide-react

### Resultado
- "Configurações" acessível apenas pelo dropdown do perfil no header (consistente em mobile e desktop)
- Menu lateral mais limpo, sem redundância
- "Organizações" (super_admin only) permanece no rodapé do mobile sidebar

