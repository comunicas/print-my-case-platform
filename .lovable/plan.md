## Problema

No histórico de conversas da Assistente IA (`/assistente`), o ícone de lixeira para excluir cada chat **não aparece visualmente**, mesmo já estando no código sem `opacity-0`. Por isso você não consegue excluir conversas pelo clique.

Causa: dentro de cada item da lista, o `<span>` do título usa `flex-1` mas o container pai e o viewport do `ScrollArea` permitem o conteúdo crescer horizontalmente. O botão de lixeira existe no DOM, mas é renderizado **fora da área visível** do sidebar de 280px, à direita do título longo.

## Solução

Ajustar `src/components/ai-agent/ConversationList.tsx`:

1. **Forçar contenção horizontal** no item da lista:
   - Trocar `min-w-0` solto por `w-full min-w-0 overflow-hidden` no `div` de cada conversa.
   - Garantir que o `ScrollArea` viewport não estoure: aplicar uma classe global no wrapper para forçar o conteúdo a respeitar a largura (`[&_[data-radix-scroll-area-viewport]>div]:!block [&_[data-radix-scroll-area-viewport]>div]:!w-full`, mesmo padrão usado em `AgentChatPanel`).

2. **Reservar espaço para o botão** e nunca deixá-lo sumir:
   - Reduzir o título com `pr-1` e garantir que o botão de lixeira tenha `shrink-0` (já tem) + `relative z-10`.
   - Diminuir o limite de truncamento de 42 → 32 caracteres no desktop (sidebar de 280px) para sobrar espaço visual ao ícone, sem depender só do CSS truncate.

3. **Aumentar a discoverability**:
   - Trocar o ícone para tom levemente mais visível por padrão (`text-muted-foreground/80`) e manter o destaque destrutivo no hover.
   - Adicionar um leve background no hover do item inteiro que evidencie a "zona clicável" do botão.

4. **Garantir clique funcional**:
   - Confirmar que o `e.stopPropagation()` no botão impede a seleção da conversa (já está no código, mas validar) e que o `AlertDialog` continua abrindo.

## Arquivos afetados

- `src/components/ai-agent/ConversationList.tsx` (ajustes de layout/contenção e truncamento).

## Validação

Após o ajuste, no viewport atual (1336×853, sidebar de 280px):
- Cada linha de conversa mostra: ícone de mensagem + título truncado em ~32 chars + ícone de lixeira **sempre visível** à direita.
- Clique na lixeira abre o `AlertDialog` de confirmação.
- Clique no resto da linha continua selecionando a conversa.
- Mobile (Sheet) continua funcionando igual.
