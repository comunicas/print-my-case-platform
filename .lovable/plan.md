

## Diagnóstico: Boulevard não aparece no filtro de estoque

### Causa raiz

Os dois PDVs pertencem a **organizações diferentes**:

| PDV | Organização | Org ID |
|-----|-------------|--------|
| Boulevard Tatuapé | HB Soluções Digitais | `56bf08d1...` |
| Tietê Plaza Shopping | RB Digital Tech | `a1b2c3d4...` |

O usuário logado (rafa bruno, **super_admin**) pertence à org "RB Digital Tech". Quando o `activeOrgId` está definido como a org do usuário (ou qualquer org específica), o hook `usePDVs` filtra por `organization_id`, mostrando apenas os PDVs daquela org.

### Por que o super_admin deveria ver ambos

O `ActiveOrgContext` inicializa super_admins com `activeOrgId = "all"`. Quando `activeOrgId === "all"`, o `usePDVs` **não aplica filtro de org** (linha 42-44), e a RLS permite acesso via `is_super_admin()`. Isso deveria funcionar.

**Porém**, se o usuário já trocou manualmente para uma org específica no `OrgSwitcher` (salvo no localStorage como `active-org-id`), o filtro restringe a apenas aquela org.

### Problema estrutural

O Boulevard e o Tietê estão em orgs separadas. Para vê-los juntos no filtro de estoque, o super_admin precisa estar com "Todas as organizações" selecionado no switcher do header. Se selecionar uma org específica, só vê os PDVs daquela org.

### Opções de correção

**Opção A — Mover Boulevard para a mesma organização (recomendado)**

Se ambos os PDVs pertencem ao mesmo negócio, o correto é que estejam na mesma organização. Executar:
```sql
UPDATE pdvs 
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE id = '72811872-2b5d-4db6-afba-46a5e0d55d9a';
```
Isso também requer mover stock_records, stock_history, uploads e sales_records para referenciar a org correta onde aplicável.

**Opção B — Manter orgs separadas, melhorar UX para super_admin**

Se as orgs separadas são intencionais, o comportamento atual é correto — o super_admin precisa selecionar "Todas" no OrgSwitcher para ver ambos. Nenhuma alteração de código necessária, apenas orientação ao usuário.

### Recomendação

Se Boulevard e Tietê são do **mesmo negócio**, a Opção A é a correta — consolidar na mesma org. Se são **negócios diferentes**, a Opção B está correta e o sistema funciona como esperado.

