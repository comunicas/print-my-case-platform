

# Corrigir ID da Maquina (fixo na edicao) e Adicionar Transferencia de PDV

## Problemas Identificados

### 1. ID da Maquina editavel
O campo "ID da Maquina" (`machine_id`) pode ser alterado ao editar um PDV. Como esse ID identifica a maquina fisica e e referenciado em uploads, sales_records e stock_records (via `device_id`), ele deve ser **fixo apos a criacao** para nao quebrar vinculos de dados.

### 2. Transferencia de PDV entre organizacoes
Nao existe opcao para mover um PDV de uma organizacao para outra. Como super_admin, seria util poder transferir um PDV (ex: maquina mudou de dono/franqueado).

### 3. Modificacoes anteriores
As modificacoes do plano anterior **ja estao implementadas**:
- Filtro por organizacao em TeamSettings e PDVsSettings (funcionando)
- Drill-down ao clicar em org na pagina Organizations (OrgDetailDialog com editar/excluir)
- UserPDVsDialog corrigido para usar `organizationId` do usuario-alvo
- RLS de INSERT para super_admin em pdvs (migrado)

## Plano de Implementacao

### 1. Tornar `machine_id` somente leitura na edicao

**Arquivo: `src/components/pdv/PDVForm.tsx`**
- Adicionar prop `isEditing?: boolean`
- Quando `isEditing=true`, renderizar o campo `machineId` como `disabled` (read-only com visual de campo bloqueado)
- Adicionar texto auxiliar "O ID da maquina nao pode ser alterado apos a criacao"

**Arquivo: `src/components/settings/PDVsSettings.tsx`**
- Passar `isEditing={true}` ao `PDVForm` no dialog de edicao

**Arquivo: `src/components/settings/OrgDetailDialog.tsx`**
- Passar `isEditing={true}` ao `PDVForm` no dialog de edicao do drill-down

### 2. Adicionar opcao de transferir PDV para outra organizacao

**Arquivo: `src/components/settings/PDVsSettings.tsx`** (dialog de edicao)
- Para super_admin: adicionar um Select de "Organizacao" no formulario de edicao
- Mostrar a organizacao atual do PDV
- Permitir trocar para outra organizacao
- Ao salvar, se a org mudou, atualizar o `organization_id` do PDV

**Arquivo: `src/hooks/usePDVs.ts`**
- O `updatePDV` ja aceita qualquer campo parcial, mas o tipo `PDVUpdate` exclui `organization_id`
- Atualizar `PDVUpdate` para incluir `organization_id` como campo opcional
- Isso permite que super_admin transfira o PDV

**Arquivo: `src/components/settings/OrgDetailDialog.tsx`**
- No dialog de edicao de PDV dentro do drill-down, tambem adicionar o seletor de organizacao para super_admin

### 3. Confirmacao de transferencia

Ao trocar a organizacao de um PDV, mostrar um alerta informando que:
- Uploads, vendas e estoque associados ao PDV permanecem vinculados
- O PDV deixara de aparecer na organizacao anterior
- Essa acao pode afetar relatorios da org de origem

## Detalhes Tecnicos

### Tipo PDVUpdate atualizado
```typescript
export type PDVUpdate = Partial<Omit<PDV, "id" | "created_at" | "updated_at">>;
// Agora inclui organization_id como campo opcional
```

### PDVForm com prop isEditing
```typescript
interface PDVFormProps {
  values: PDVFormData;
  onChange: (values: PDVFormData) => void;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
  idPrefix?: string;
  isEditing?: boolean; // novo
}
```

### RLS
A policy de UPDATE em `pdvs` ja permite super_admin (`OR is_super_admin(auth.uid())`), entao a atualizacao de `organization_id` ja e permitida sem nova migracao.

## Arquivos Impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/pdv/PDVForm.tsx` | Prop `isEditing` para bloquear machineId |
| `src/hooks/usePDVs.ts` | Incluir `organization_id` em PDVUpdate |
| `src/components/settings/PDVsSettings.tsx` | `isEditing` no form + seletor de org na edicao |
| `src/components/settings/OrgDetailDialog.tsx` | `isEditing` no form + seletor de org na edicao |

