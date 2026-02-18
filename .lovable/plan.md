
# Proteção Reforçada Contra Exclusão Acidental de PDV

## Diagnóstico

O PDV "Tatuapé" foi excluído e, como as foreign keys têm `ON DELETE CASCADE`, todos os dados vinculados (vendas, estoque, uploads) foram permanentemente removidos junto. Não restou nenhum registro órfão — a cascata funcionou, mas o usuário não tinha proteção suficiente para evitar o clique acidental.

A feature de contagem de impacto foi implementada, mas o PDV foi apagado antes dela estar em vigor. Para que isso nunca mais ocorra, o plano é adicionar **múltiplas camadas de proteção** no fluxo de exclusão.

## Camadas de Proteção Propostas

### Camada 1 — Bloqueio com dados (já implementada, porém insuficiente)

O diálogo atual mostra a contagem e desabilita o botão durante o carregamento. Mas o problema é que **quando há registros, ainda é possível confirmar com um único clique após ver o aviso**.

### Camada 2 — Confirmação por digitação do nome (nova)

Para PDVs com dados (salesCount > 0 OU stockCount > 0), exigir que o usuário **digite o nome exato do PDV** em um campo de texto para desbloquear o botão de exclusão. Isso é o mesmo padrão usado pelo GitHub, AWS e outros sistemas ao deletar recursos críticos.

```
[campo de texto]  Digite "Tietê Plaza Shopping" para confirmar
```

O botão "Excluir Permanentemente" só fica ativo quando o texto digitado corresponde exatamente ao nome do PDV.

### Camada 3 — Proteção para PDV sem dados (melhoria visual)

Para PDVs sem dados (zerados), manter o fluxo simples sem exigir digitação — apenas a confirmação do clique já é suficiente, pois não há risco de perda de dados.

## Fluxo Revisado

```text
Clique no ícone lixeira de um PDV
        ↓
Diálogo abre — hook busca contagem
        ↓
[Se PDV tem dados: salesCount > 0 OU stockCount > 0]
  ┌─────────────────────────────────────────────────────┐
  │ ⚠️  ATENÇÃO: Dados que serão excluídos               │
  │  📊  709 registros de vendas                          │
  │  📦  85  registros de estoque                         │
  │                                                       │
  │  Para confirmar, digite o nome do PDV:                │
  │  ┌─────────────────────────────────────────────────┐ │
  │  │ Tietê Plaza Shopping                            │ │
  │  └─────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────┘
  Botão [Excluir Permanentemente] só ativa quando texto = nome
        ↓
[Se PDV não tem dados]
  Diálogo simples sem campo de texto — botão sempre ativo
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/components/settings/PDVsSettings.tsx` | Adicionar state `confirmationText`, campo `<Input>` condicional e lógica de comparação no botão de exclusão |

Nenhuma mudança no banco de dados necessária — a proteção é inteiramente no frontend.

## Detalhes de Implementação

- Novo state local: `confirmationText: string` — reseta para `""` sempre que o diálogo fecha ou abre
- O campo de input só aparece quando `(salesCount > 0 || stockCount > 0) && !isImpactLoading`
- O botão "Excluir Permanentemente" fica `disabled` quando:
  - `isImpactLoading` (ainda carregando os dados), OU
  - `deletePDV.isPending` (exclusão em andamento), OU
  - `salesCount > 0 || stockCount > 0` E `confirmationText !== deletingPdv?.name` (PDV tem dados e o texto não confere)
- Placeholder do input: `'Digite "${deletingPdv?.name}" para confirmar'`
- Label acima do input: texto explicativo claro

## Sobre o Plano Anterior (constraint de machine_id)

O plano de corrigir `UNIQUE (machine_id)` para `UNIQUE (machine_id, organization_id)` é **independente e continua válido** — ele resolve um problema diferente (multi-tenant) e deve ser aplicado separadamente. Este plano foca exclusivamente na proteção contra exclusão acidental.
