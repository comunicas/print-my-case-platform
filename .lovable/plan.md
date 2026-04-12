

## Corrigir Lógica de Sugestões de Alocação + Limpar Dados Incorretos

### Problema
A edge function `process-spreadsheet` gera sugestões duplicadas e incorretas por 3 motivos:
1. **Matching parcial** (`.includes()`) — "iPhone 15" casa com "iPhone 15 Plus", gerando sugestões cruzadas
2. **Sem deduplicação** — cada upload cria novas sugestões mesmo que já existam pendentes para o mesmo produto+PDV
3. **Loop redundante** — itera por cada pre_stock item, criando múltiplas sugestões para o mesmo produto

### Mudanças

**1. Migration — limpar as 216 sugestões pendentes incorretas**
```sql
DELETE FROM pending_allocations WHERE status = 'pending';
```

**2. `supabase/functions/process-spreadsheet/index.ts` — corrigir lógica**

- **Matching exato**: substituir `.includes()` por comparação exata normalizada (lowercase + trim)
```typescript
// ANTES (errado)
return normalizedNew.includes(normalizedPs) || normalizedPs.includes(normalizedNew);

// DEPOIS (correto)  
return normalizedNew === normalizedPs;
```

- **Deduplicação**: antes de inserir, buscar `pending_allocations` existentes com status `pending` para o mesmo `pdv_id` e verificar se já existe sugestão para o mesmo `product_name` (normalizado). Pular se já existir.

- **Uma sugestão por produto**: consolidar o loop para gerar no máximo 1 sugestão por `product_name` + `pdv_id`, usando o primeiro pre_stock item que fizer match exato.

### Arquivos afetados
- `supabase/functions/process-spreadsheet/index.ts` — lógica de matching e deduplicação
- Migration SQL — limpeza dos 216 registros pendentes incorretos

