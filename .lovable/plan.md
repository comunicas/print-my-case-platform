
# Plano: Finalizar Otimizacoes + Corrigir Permissoes de Operador/Visualizador

## Estagio Atual das Otimizacoes (Checklist)

| # | Item | Status |
|---|------|--------|
| 2.2 | useMemo no AuthContext | Feito |
| 2.3 | useMemo no ActiveOrgContext | Feito |
| 4.1 | refetchIntervalInBackground: false (notifications) | Feito |
| 4.2 | Remover prefetch com query keys divergentes | Feito |
| 4.3 | Remover prefetch do dashboard divergente | Feito |
| 1.1 | Lazy-load dados de estoque no dashboard | Feito |
| 1.2 | Server-side filtering no ProductAnalytics | Feito |
| 1.3 | Reduzir DASHBOARD_SALES_LIMIT para 5k | Feito |
| 1.4 | Reduzir PRODUCT_STOCK_SALES_LIMIT para 3k | Feito |
| 2.1 | ProfileContext dedicado com 2 contextos | Feito |
| 1.5 | RPC get_sales_date_range | Feito |
| 3.2 | Lazy import do xlsx | Feito (ja usa import() dinamico) |
| 2.4 | React.memo nos SlotStack | Pendente (baixa prioridade) |

**Resultado: 12/13 itens concluidos (92%). Resta apenas o item 2.4 (baixa prioridade).**

---

## Bugs de Permissao Identificados

Analisando a hierarquia de papeis (`super_admin > org_admin > operator > viewer`), os seguintes problemas foram encontrados:

### Bug 1: Viewer pode criar uploads (ALTO)
O botao "Novo Upload" na pagina de Uploads e visivel para TODOS os usuarios, incluindo `viewer`. Segundo a definicao de permissoes em `team.ts`, viewers tem "Apenas leitura" e nao deveriam poder fazer uploads.

**Localizacao**: `src/pages/Uploads.tsx` linha 190 — botao nao tem guarda de permissao.

**Correcao**: Exibir o botao apenas para `operator` e acima (admins + operators).

### Bug 2: IntegrationsSettings visivel para todos (MEDIO)
A aba "Integracoes" em Configuracoes mostra o painel de API Keys para operators e viewers. O botao "Nova Key" esta visivel, e embora a RLS bloqueie a criacao (apenas admins), a interface exibe os endpoints de API e o formulario de criacao sem necessidade.

**Localizacao**: `src/components/settings/IntegrationsSettings.tsx` — nao verifica role do usuario.

**Correcao**: 
- Mostrar API Keys (criar/revogar/excluir) apenas para admins
- Operators e viewers veem apenas informacoes de integracao (Google Drive, Webhooks — ambos "Em breve")

### Bug 3: PDVsSettings mostra todos os PDVs da org para operators/viewers (BAIXO)
Operadores com atribuicoes especificas de PDV (via `user_pdvs`) veem TODOS os PDVs da organizacao na aba PDVs de Configuracoes, em vez de apenas os PDVs atribuidos a eles.

**Localizacao**: `src/components/settings/PDVsSettings.tsx` — `usePDVs()` nao filtra por `useUserAllowedPDVs`.

**Correcao**: Para operators/viewers com restricoes, filtrar a lista de PDVs exibidos usando `useUserAllowedPDVs`.

### Bug 4: Viewer pode ver botao de upload em UploadDetails (BAIXO)
Verificar se a pagina de detalhes do upload tambem expoe acoes indevidas para viewers.

---

## Plano de Implementacao

### Fase 1: Correcoes de permissao

**Arquivo: `src/pages/Uploads.tsx`**
- Adicionar `role` ao destructuring de `useProfile()`
- Condicionar o botao "Novo Upload" a `role !== 'viewer'` (operators PODEM fazer upload, viewers NAO)

**Arquivo: `src/components/settings/IntegrationsSettings.tsx`**
- Importar `useProfile` e verificar `isAdmin`
- Envolver a secao de API Keys (botao Nova Key, lista de keys) com `{isAdmin && ...}`
- Manter as cards de Google Drive e Webhooks visiveis para todos (sao informativas)

**Arquivo: `src/components/settings/PDVsSettings.tsx`**
- Importar `useUserAllowedPDVs`
- Filtrar `filteredPdvs` para mostrar apenas PDVs permitidos quando `hasRestrictions === true`

### Fase 2: Item 2.4 pendente (opcional)

**Arquivo: `src/components/stock/SlotStack.tsx`**
- Envolver o componente com `React.memo` para evitar re-renders quando `focusedSlot` muda no grid

---

## Detalhes Tecnicos

### Uploads.tsx — guarda de permissao
```typescript
const { isAdmin, role } = useProfile();
const canUpload = role !== 'viewer';

// No JSX:
{canUpload && (
  <Button onClick={() => setIsUploadDialogOpen(true)} ...>
    Novo Upload
  </Button>
)}
```

### IntegrationsSettings.tsx — secao admin-only
```typescript
const { isAdmin } = useProfile();

// Envolver a secao de API Keys:
{isAdmin && (
  <Card> {/* API Keys card inteira */} </Card>
)}
```

### PDVsSettings.tsx — filtro por PDVs permitidos
```typescript
const { allowedPdvIds, hasRestrictions } = useUserAllowedPDVs();

const filteredPdvs = pdvs
  .filter(pdv => !hasRestrictions || allowedPdvIds?.includes(pdv.id))
  .filter(pdv => /* busca existente */);
```
