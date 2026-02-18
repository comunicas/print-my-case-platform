
# Bug: Botão "Excluir Permanentemente" não reflete visualmente o estado desabilitado

## Diagnóstico do Problema

O teste ao vivo revelou dois comportamentos incorretos:

**O que funciona:**
- O diálogo de impacto abre corretamente mostrando 709 vendas e 85 registros de estoque
- O campo de confirmação aparece e aceita texto
- Com texto errado, o PDV **não é excluído** (a proteção funciona logicamente)

**O que está errado:**
- O botão "Excluir Permanentemente" aparece **visualmente ativo/vermelho** mesmo quando o texto digitado é errado ou o campo está vazio
- Não há nenhum indicador visual de que o botão está bloqueado

**Causa raiz:** O componente `AlertDialogAction` do Radix UI renderiza via `AlertDialogPrimitive.Action`, que **não propaga o atributo `disabled` para o elemento `<button>` HTML** de forma que respeite os estilos `disabled:opacity-50 disabled:cursor-not-allowed`. O Radix trata o `disabled` internamente para impedir a chamada do `onClick`, mas o CSS não é aplicado.

Confirmado por console log: `Warning: Function components cannot be given refs. Check the render method of PDVsSettings.` — o próprio Radix avisa sobre inconsistências no ref do AlertDialog.

## Solução

Substituir `AlertDialogAction` por um `Button` normal do shadcn dentro do `AlertDialogFooter`. O `Button` do shadcn **aplica corretamente** `disabled:opacity-50 disabled:cursor-not-allowed` via `buttonVariants`. O clique deve:

1. Chamar `handleDeletePdv()` manualmente
2. **Não fechar o diálogo automaticamente** — manter o `AlertDialog` aberto até o `onSuccess` da mutation (que já faz `setIsDeleteDialogOpen(false)`)

Para isso, o botão precisa chamar `e.preventDefault()` para impedir o comportamento padrão do Radix de fechar o modal ao clicar em `AlertDialogAction`, substituindo-o por um `Button` que controla o fechamento via `onSuccess`.

## Mudanças Técnicas

### `src/components/settings/PDVsSettings.tsx`

Substituir o `AlertDialogAction` atual:

```tsx
// ANTES (AlertDialogAction — não respeita disabled visualmente)
<AlertDialogAction
  onClick={handleDeletePdv}
  disabled={deletePDV.isPending || isImpactLoading || !isConfirmationValid}
  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
>
  ...
</AlertDialogAction>
```

Por um `Button` padrão com as mesmas props:

```tsx
// DEPOIS (Button — respeita disabled com opacity + cursor + visual correto)
<Button
  variant="destructive"
  onClick={handleDeletePdv}
  disabled={deletePDV.isPending || isImpactLoading || !isConfirmationValid}
>
  ...
</Button>
```

Como o `Button` não é um `AlertDialogAction`, ele **não fecha o diálogo automaticamente**. O fechamento já acontece via `onSuccess` em `handleDeletePdv`:
```ts
onSuccess: () => {
  setIsDeleteDialogOpen(false);  // ← já controla o fechamento
  setDeletingPdv(null);
  setConfirmationText("");
},
```

Isso é o comportamento **correto e desejado**: o diálogo só fecha após a exclusão ser confirmada pelo servidor.

## Arquivo a Modificar

| Arquivo | Mudança |
|---|---|
| `src/components/settings/PDVsSettings.tsx` | Substituir `<AlertDialogAction>` por `<Button variant="destructive">` no footer do Delete Dialog; importar `Button` já está no topo do arquivo |

## Resultado Esperado

- Com campo vazio: botão vermelho com **opacity reduzida** + cursor `not-allowed`
- Com texto errado: botão vermelho com **opacity reduzida** + cursor `not-allowed`
- Com nome exato digitado: botão vermelho **totalmente ativo**, clicável
- Ao clicar com nome correto: exclusão ocorre, diálogo fecha via `onSuccess`
- O `AlertDialogCancel` ("Cancelar") permanece inalterado e funciona normalmente
