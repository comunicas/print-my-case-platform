

# Copiar Despesas Fixas do Mes Anterior

## Contexto

Quando o usuario navega para um mes que ainda nao tem despesas cadastradas, ele precisa recriar manualmente todas as despesas fixas (Aluguel, Licenciamento, Internet, etc.). Essa funcionalidade permite copiar automaticamente as despesas fixas e deducoes recorrentes do mes anterior com um clique.

## Comportamento

1. Quando o mes atual **nao tem nenhuma despesa** cadastrada, exibir um banner/card com a opcao "Copiar despesas do mes anterior"
2. Ao clicar, buscar todas as entries do mes anterior (categorias `fixas` e `deducoes`) e inserir copias com o `reference_month` do mes atual
3. Despesas de `implantacao` **nao sao copiadas** (sao pontuais)
4. Apos copiar, invalidar queries e mostrar toast de sucesso
5. O banner so aparece para admins e quando o mes atual esta vazio

## Alteracoes

### 1. `useFinancialEntries.ts` - Nova mutation `copyFromPreviousMonth`

Adicionar uma mutation que:
- Busca entries do mes anterior com `category IN ('fixas', 'deducoes')` para a mesma org (e mesmo PDV se filtrado)
- Insere copias com o `reference_month` do mes atual
- Retorna a quantidade de entries copiadas

```typescript
const copyFromPreviousMonth = useMutation({
  mutationFn: async ({ targetMonth }: { targetMonth: Date }) => {
    const prevMonthStr = format(subMonths(startOfMonth(targetMonth), 1), "yyyy-MM-dd");
    const targetMonthStr = format(startOfMonth(targetMonth), "yyyy-MM-dd");
    
    // Buscar entries do mes anterior (fixas + deducoes)
    let query = supabase
      .from("financial_entries")
      .select("*")
      .eq("organization_id", orgId!)
      .eq("reference_month", prevMonthStr)
      .in("category", ["fixas", "deducoes"]);
    
    if (pdvId) {
      query = query.or(`pdv_id.eq.${pdvId},pdv_id.is.null`);
    }
    
    const { data: prevEntries, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!prevEntries?.length) throw new Error("Nenhuma despesa encontrada no mes anterior");
    
    // Inserir copias no mes atual
    const copies = prevEntries.map(e => ({
      organization_id: e.organization_id,
      pdv_id: e.pdv_id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      reference_month: targetMonthStr,
      created_by: profile!.id,
    }));
    
    const { error: insertError } = await supabase
      .from("financial_entries")
      .insert(copies);
    if (insertError) throw insertError;
    
    return copies.length;
  },
  onSuccess: (count) => {
    queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
    toast.success(`${count} despesa(s) copiada(s) do mes anterior`);
  },
  onError: (error) => {
    toast.error("Erro ao copiar despesas", { description: error.message });
  },
});
```

### 2. `Financeiro.tsx` - Banner "Copiar do mes anterior"

Adicionar um card entre a DRE e a lista de despesas que aparece apenas quando:
- `isAdmin === true`
- `entries.length === 0`
- `!entriesLoading`

O card tera um icone `Copy`, texto explicativo e botao de acao.

```text
+------------------------------------------------------+
| [Copy icon]  Nenhuma despesa neste mes                |
|  Deseja copiar as despesas fixas do mes anterior?     |
|                                     [Copiar despesas] |
+------------------------------------------------------+
```

### 3. Hook retorno

O `useFinancialEntries` passara a retornar `copyFromPreviousMonth` junto com as outras mutations.

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useFinancialEntries.ts` | Adicionar mutation `copyFromPreviousMonth` |
| `src/pages/Financeiro.tsx` | Adicionar banner condicional + chamar `copyFromPreviousMonth` |

## Observacoes

- A copia usa `subMonths` para calcular o mes anterior, ja importado no projeto
- Nao precisa de migration SQL - usa apenas INSERT nas mesmas tabelas existentes
- As RLS policies ja cobrem o INSERT (admin + mesma org + created_by = auth.uid)
