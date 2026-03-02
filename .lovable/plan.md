

# Adicionar suporte para configuracao de custos por PDV no DREConfigCard

## Contexto

O hook `useDREConfig` ja busca config especifica por PDV (fallback para org-level), porem a mutacao `upsertConfig` sempre salva com `pdv_id IS NULL` (nivel organizacao). A UI precisa permitir que o admin escolha se a config e global ou especifica para o PDV selecionado.

## Resultado do teste de duplicatas

- Copiar despesas do mes anterior: funcionando
- Apos copiar, o banner desaparece (UI impede re-clique)
- A verificacao de duplicatas no backend funciona como rede de seguranca
- Margens exibem "--" quando receita e zero

**Obs:** Os dados de teste criados em Abril e Maio de 2026 precisam ser limpos.

## Alteracoes propostas

### 1. `src/hooks/useDREConfig.ts` - Aceitar pdvId na mutacao

Modificar `upsertConfig.mutationFn` para receber um campo opcional `pdv_id` nos valores. Quando presente, a mutacao salva/atualiza o registro com aquele `pdv_id`; quando ausente, mantém o comportamento atual (org-level, `pdv_id IS NULL`).

```text
mutationFn: async (values: { 
  unit_cost: number; 
  stone_rate: number; 
  tax_rate: number;
  pdv_id?: string | null;  // NOVO
})
```

A logica de check/insert/update passa a usar o `pdv_id` informado em vez de fixar `IS NULL`.

### 2. `src/components/financeiro/DREConfigCard.tsx` - Toggle de escopo

Adicionar um indicador visual e toggle para que o admin escolha salvar a config como:
- **Global (organizacao)** - aplica a todos os PDVs sem config propria
- **Especifica para o PDV selecionado** - so aplica quando aquele PDV esta filtrado

Alteracoes na UI:
- Mostrar um Badge indicando se a config atual vem do PDV ou e herdada da org
- Adicionar um Switch ou ToggleGroup com labels "Global" / "Este PDV" (visivel apenas quando um PDV esta selecionado)
- O `handleSave` passa `pdv_id` para a mutacao quando o toggle esta em "Este PDV"
- Quando nenhum PDV esta selecionado (filtro "Todos"), o toggle nao aparece e a config e sempre global

### 3. Limpeza dos dados de teste

Excluir as 10 entradas financeiras criadas durante o teste (Abril e Maio 2026).

## Detalhes tecnicos

- O banco ja suporta `pdv_id` na tabela `dre_config` com indices unicos parciais (um para `pdv_id IS NULL`, outro para `pdv_id IS NOT NULL`)
- As RLS policies ja cobrem insert/update/select/delete para admins na mesma org
- Nenhuma migration necessaria
- Arquivos modificados: `useDREConfig.ts`, `DREConfigCard.tsx`

