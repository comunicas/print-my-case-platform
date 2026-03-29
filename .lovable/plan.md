

## Problema: Edge Function não foi redeployada

Os logs da edge function `process-spreadsheet` mostram apenas "booted" e "shutdown" — nenhuma mensagem de deduplicação aparece, confirmando que a versão em produção **não contém** o código de deduplicação cross-PDV que foi adicionado ao arquivo `supabase/functions/process-spreadsheet/index.ts`.

### Ação necessária

**1. Forçar redeploy da edge function `process-spreadsheet`**
- Adicionar um comentário trivial no arquivo (ex: `// force redeploy v2`) para garantir que o sistema detecte a mudança e faça o deploy

**2. Verificar dados atuais**
- Confirmar via query que Tietê não tem registros com `device_id = '1001013'` (limpeza anterior foi executada)

**3. Após deploy, testar**
- Subir a planilha do Boulevard selecionando Tietê como PDV
- Verificar nos logs que mensagens de deduplicação cross-PDV aparecem
- Confirmar que 0 registros são inseridos (todos duplicados)

### Alteração

**`supabase/functions/process-spreadsheet/index.ts`** — Adicionar comentário para forçar redeploy:
```typescript
// Cross-PDV dedup v2 - force redeploy
```

Isso é suficiente para triggerar um novo deploy automático da edge function com o código correto de deduplicação.

