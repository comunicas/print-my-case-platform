
# Contagem Prévia de Dados no Diálogo de Exclusão de PDV

## Objetivo

Antes de o usuário confirmar a exclusão de um PDV, o sistema consulta o banco e exibe quantos registros de vendas e estoque serão removidos em cascata. Isso dá visibilidade completa do impacto da ação antes que ela seja irreversível.

## Fluxo da Experiência

```text
Usuário clica em [Excluir] no card do PDV
        ↓
Diálogo abre com spinner "Verificando dados..."
        ↓
Query paralela: COUNT de sales_records + COUNT de stock_records para o pdv_id
        ↓
Diálogo exibe o resumo completo:
  "Tem certeza que deseja excluir 'Nome do PDV'?"
  ┌─────────────────────────────────────────────┐
  │ ⚠️  Dados que serão excluídos permanentemente │
  │  📊  103 registros de vendas                  │
  │  📦  85  registros de estoque                 │
  └─────────────────────────────────────────────┘
  "Esta ação não pode ser desfeita."
        ↓
Usuário clica [Excluir Permanentemente] ou [Cancelar]
```

## Detalhes Técnicos

### Novo hook: `usePDVImpact`

Será criado um novo hook dedicado em `src/hooks/usePDVImpact.ts` que:

- Recebe um `pdvId: string | null`
- Só executa a query quando `pdvId` é não-nulo (`enabled: !!pdvId`)
- Faz **duas queries paralelas** com `{ count: "exact", head: true }` (não traz dados, só conta):
  - `supabase.from("sales_records").select("*", { count: "exact", head: true }).eq("pdv_id", pdvId)`
  - `supabase.from("stock_records").select("*", { count: "exact", head: true }).eq("pdv_id", pdvId)`
- Retorna `{ salesCount, stockCount, isLoading }`
- `staleTime: 0` — sempre busca dados frescos ao abrir o diálogo

### Mudanças em `PDVsSettings.tsx`

- O state `deletingPdv` já existe — ele será passado como `pdvId` para o novo hook
- O `AlertDialog` recebe o resultado do hook para mostrar os counts
- Enquanto o hook está carregando, o diálogo mostra um skeleton/spinner no lugar dos números
- O botão "Excluir" fica desabilitado enquanto os dados ainda estão sendo carregados (para evitar exclusão antes de o usuário ver o aviso)
- Se não houver registros (PDV novo/vazio), exibe uma mensagem neutra: "Este PDV não possui registros de vendas ou estoque vinculados."
- O texto do botão de confirmação muda para "Excluir Permanentemente" para reforçar a gravidade da ação

## Arquivos a Modificar/Criar

| Arquivo | Tipo | Mudança |
|---|---|---|
| `src/hooks/usePDVImpact.ts` | Novo | Hook que conta sales_records e stock_records por pdv_id |
| `src/components/settings/PDVsSettings.tsx` | Editar | Integrar o hook e atualizar o AlertDialog com a contagem |

## Nenhuma mudança no banco de dados

As tabelas `sales_records` e `stock_records` já existem com as políticas RLS corretas que permitem aos admins consultar registros de PDVs da sua organização — as queries de COUNT funcionarão com as permissões atuais.

## Resultado Esperado

- Ao clicar no ícone de lixeira de um PDV, o diálogo abre imediatamente
- Enquanto busca os dados (milissegundos), exibe um pequeno indicador de carregamento dentro do diálogo
- Exibe a contagem real de registros que serão deletados em cascata
- O botão de confirmação só fica ativo após a consulta terminar
- Para PDVs sem dados, exibe mensagem específica sem alerta de perda de dados
