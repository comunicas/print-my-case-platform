

# Revisao: "Todas as organizacoes" -- problemas de agregacao

## Diagnostico

Ao selecionar "Todas as organizacoes", o `activeOrgId` e setado para `"all"`. A maioria dos hooks trata isso corretamente no **Dashboard** (useDashboard, usePDVs, useStockHistory removem filtros de org quando o valor e "all"). Porem, varios hooks e paginas **nao tratam** o caso "all" e acabam passando o valor literal ou quebrando a logica.

## Problemas encontrados

### 1. useFinancialEntries / useDRE -- NAO agrega todas as orgs
- `orgId = activeOrgId ?? profile?.organization_id` resulta em `"all"` (string literal)
- Usa `.eq("organization_id", "all")` que nao retorna nenhum resultado
- **Impacto:** Financeiro fica vazio quando "Todas as organizacoes" esta selecionado

### 2. useUploads -- ignora contexto de org completamente
- A query nao filtra por organizacao; depende apenas do RLS
- O RLS via `user_can_access_pdv` funciona para super_admin (ve tudo)
- **Parcialmente OK**, mas sem consistencia com o filtro de org do header

### 3. useSlotsData / useProductStock -- depende apenas de pdvId e allowedPdvIds
- Quando "Todas as organizacoes" esta ativo e nenhum PDV e selecionado, o super_admin ve todos os slots de todas as orgs (via RLS)
- **OK** para super_admin, mas nao filtra quando uma org especifica e selecionada no switcher (o `usePDVs` ja cuida disso pois recebe `activeOrgId`)

### 4. useNotifications -- sem filtro de org
- Busca todas as notificacoes que o RLS permite
- **OK** para super_admin (ve tudo), mas nao filtra por org ativa

### 5. useApiKeys -- trata "all" corretamente
- `const orgId = isAllOrgs ? null : activeOrgId;` e depois nao aplica filtro se null
- **OK**

### 6. Financeiro (pagina) -- nao passa contexto de org
- `usePDVs()` sem `organizationId` usa `activeOrgId` diretamente, o que funciona
- Mas `useDRE` e `useFinancialEntries` usam `activeOrgId` como UUID direto (bug)

## Solucao

### Passo 1: Corrigir useFinancialEntries

Quando `activeOrgId === "all"`, nao filtrar por `organization_id`, trazendo dados de todas as orgs:

```typescript
// De:
const orgId = activeOrgId ?? profile?.organization_id;
// query.eq("organization_id", orgId!)

// Para:
const orgId = activeOrgId === "all" ? null : (activeOrgId ?? profile?.organization_id);
// Se orgId, filtra; senao, nao aplica filtro de org
```

Mesma logica nas mutations (createEntry, copyFromPreviousMonth): usar `profile?.organization_id` como fallback quando orgId e null, ja que a criacao sempre precisa de uma org concreta.

### Passo 2: Corrigir useDRE

Quando `orgId === "all"` ou null (modo global), buscar PDVs de todas as organizacoes em vez de filtrar por uma org especifica:

```typescript
const orgId = activeOrgId === "all" ? null : (activeOrgId ?? profile?.organization_id);

// Na query de vendas:
if (orgId) {
  // Filtrar PDVs da org
  pdvQuery = pdvQuery.eq("organization_id", orgId);
}
// Se orgId e null, busca todos os PDVs (RLS garante isolamento)
```

### Passo 3: Corrigir useFinancialEntries mutations

As operacoes de escrita (create, copy) devem usar `profile?.organization_id` quando o contexto e "all", pois um lancamento financeiro sempre pertence a uma organizacao concreta:

```typescript
const writeOrgId = orgId ?? profile?.organization_id;
// Usar writeOrgId nas mutations
```

### Passo 4: Validar pagina Financeiro

Adicionar tratamento para modo "Todas as organizacoes" na pagina -- possivelmente mostrar um aviso de que o DRE exibe dados consolidados de todas as orgs.

## Resumo tecnico

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useFinancialEntries.ts` | Tratar `activeOrgId === "all"` removendo filtro de org na leitura, usando org do perfil na escrita |
| `src/hooks/useDRE.ts` | Tratar `activeOrgId === "all"` removendo filtro de org na busca de PDVs |

- **Arquivos modificados:** 2
- **Risco:** Baixo -- apenas corrige logica de filtro que ja estava silenciosamente falhando
- **Impacto:** Financeiro e DRE funcionarao corretamente quando "Todas as organizacoes" estiver selecionado, mostrando dados agregados

