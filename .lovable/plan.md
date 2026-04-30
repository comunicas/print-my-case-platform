## Objetivo

Na lista de conversas do Assistente IA (coluna esquerda), os títulos longos vazam para fora do card e o botão excluir só aparece no hover, dando a sensação de que não existe.

## Problema atual

- Títulos como "Quais foram os 10 produtos mais vendidos nos últimos 30 dias..." atravessam a borda direita do card.
- O botão Trash2 está com `md:opacity-0 md:group-hover:opacity-100`, então em desktop ele só surge ao passar o mouse — nada visível na imagem que o usuário mandou.
- Falta um limite duro de caracteres no título exibido.

## Mudanças (apenas em `src/components/ai-agent/ConversationList.tsx`)

1. **Truncar título com limite de caracteres**
   - Helper local `truncateTitle(text, max=42)` que corta e adiciona `…`.
   - Exibe `truncateTitle(c.title || "Conversa sem título")` dentro do `<span>`.
   - Mantém `truncate` do Tailwind como fallback CSS para telas menores, e adiciona `title={c.title}` para tooltip nativo com o texto completo.

2. **Botão excluir sempre visível**
   - Remover as classes `md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100` e o `activeId === c.id && "md:opacity-100"`.
   - Manter apenas `opacity-100` em todas as resoluções, com cor neutra (`text-muted-foreground`) virando destrutiva no hover (`hover:text-destructive hover:bg-destructive/10`) — padrão já adotado em outras telas (API Keys).

3. **Garantir contenção do item**
   - Adicionar `min-w-0` no container flex do item para o `truncate` funcionar dentro do `ScrollArea`.
   - Garantir que o `<span>` use `min-w-0 flex-1 truncate`.

## Fora do escopo

- Renomear conversas, edição inline, paginação ou busca de histórico.
- Mudanças no backend ou na geração automática do título.

## Validação

- Abrir `/assistente` com conversas longas e confirmar:
  - Título cortado em ~42 caracteres com `…`.
  - Tooltip nativo mostra o título completo.
  - Ícone de lixeira visível em todos os itens (mobile e desktop).
  - Clicar no ícone abre o AlertDialog de confirmação já existente.
