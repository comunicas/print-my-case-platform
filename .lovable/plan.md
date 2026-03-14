

# Correção do autocomplete de descrição no formulário de despesas

## Problema identificado

O campo de autocomplete de descrição **não funciona corretamente** porque o `PopoverTrigger` com `asChild` envolve o `<Input>`, transformando-o em um elemento do tipo "button" internamente. Isso causa:

1. O popover com sugestões não aparece ao focar/digitar
2. O campo pode perder foco ou não aceitar digitação em alguns cenários
3. O Radix Popover dentro de um Dialog tem conflitos de foco conhecidos

A query de dados funciona corretamente -- retorna 6 descrições únicas para a categoria "fixas" (Aluguel, Internet, Licenciamento, Limpeza, Marketing).

## Solução

Substituir a abordagem `Popover + PopoverTrigger` por um padrão de **dropdown controlado manualmente** usando posicionamento absoluto, sem depender do Radix Popover. Isso elimina os conflitos de foco com o Dialog.

### Alteracao em `src/components/financeiro/FinancialEntryForm.tsx`

1. Remover imports de `Popover`, `PopoverContent`, `PopoverTrigger`
2. Manter o `Input` como elemento normal (sem wrapper de trigger)
3. Renderizar a lista de sugestoes como um `div` com posicao absoluta abaixo do input, controlado pelo estado `popoverOpen`
4. Usar `Command` / `CommandList` / `CommandGroup` / `CommandItem` dentro desse div para manter o mesmo visual
5. Adicionar handler `onBlur` com `setTimeout` para fechar ao perder foco (permitindo clique nos itens antes)

### Estrutura do campo corrigido

```text
<FormItem className="relative">
  <FormLabel>Descricao</FormLabel>
  <FormControl>
    <Input
      ref={inputRef}
      value={field.value}
      onChange={...}  // atualiza valor + abre lista
      onFocus={...}   // abre lista
      onBlur={...}    // fecha lista com delay
    />
  </FormControl>
  {popoverOpen && filteredSuggestions.length > 0 && (
    <div className="absolute z-50 top-full mt-1 w-full ...">
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem onMouseDown={...} />
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )}
</FormItem>
```

Pontos importantes:
- Usar `onMouseDown` (nao `onSelect`) nos itens para evitar que o `onBlur` do input feche a lista antes do clique
- `z-50` garante que a lista fique acima dos outros campos do formulario
- Sem conflito com o Dialog pai pois nao usa Radix Popover

### Impacto

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/components/financeiro/FinancialEntryForm.tsx` | Alterado | Trocar Popover por dropdown absoluto |

Nenhuma migration necessaria. O hook `useFinancialDescriptions` permanece inalterado.

