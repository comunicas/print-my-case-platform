
## Fix: Compras Não Aparecem Quando "Todas as Organizações" Selecionado

### Causa Raiz

O hook `usePreStock` passa `activeOrgId` diretamente como filtro UUID — quando o super admin tem "Todas as organizações" selecionado, `activeOrgId` é a string `"all"`, causando erro 400 (`invalid input syntax for type uuid: "all"`).

### Solução

Seguir o padrão já usado em `useFinancialEntries`, `useDRE`, etc.: detectar `activeOrgId === "all"` e usar o `organization_id` do perfil como fallback para escrita, e remover o filtro de org para leitura (ou usar o fallback).

### Mudanças

**`src/hooks/usePreStock.ts`**:

1. Importar `useProfile` e extrair `profile`
2. Adicionar lógica `isAllOrgs` / `orgId` / `writeOrgId`:
   - `isAllOrgs = activeOrgId === "all"`
   - `orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id)`
   - `writeOrgId = orgId ?? profile?.organization_id`
3. Na query de listagem: se `orgId` é null (all orgs), não adicionar filtro `.eq("organization_id", ...)` — o RLS já filtra por acesso
4. Na query de `productNames`: mesma lógica — se all orgs, buscar PDVs sem filtro de org (o RLS filtra)
5. Na mutation `createItem`: usar `writeOrgId` em vez de `activeOrgId`
6. Manter `enabled: !!activeOrgId` (funciona porque "all" é truthy)

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/usePreStock.ts` | Tratar `activeOrgId === "all"` seguindo padrão existente |
