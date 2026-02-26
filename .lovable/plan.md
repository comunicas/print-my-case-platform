

# Fase 5: Robustez de Error Handling nos Uploads

## Problemas Identificados

### 5.1 PDV null no mapeamento de uploads
- **Bug**: O join `pdv:pdvs(name, machine_id)` retorna `null` se o PDV foi deletado, mas o codigo acessa `upload.pdv.name` sem verificacao (linha 266 do Uploads.tsx e linha 229 do useUploads.ts)
- **Risco**: Crash em runtime se um upload fica orfao apos a exclusao de um PDV
- **Correcao**: No `useUploads.ts`, tratar PDV null com fallback `{ name: "PDV removido", machine_id: "-" }`. Na interface `UploadListItem`, tornar `pdv` nullable ou usar o fallback

### 5.2 eslint-disable no useEffect de reset de pagina
- **Bug**: Linha 67 tem `// eslint-disable-next-line react-hooks/exhaustive-deps` porque `pagination.setPage` nao esta listado como dependencia
- **Causa**: `pagination.setPage` e uma funcao que muda de referencia a cada render (nao e estavel)
- **Correcao**: A funcao `setPage` no `usePaginatedQuery.ts` ja usa `useCallback` mas depende de `totalPages` que muda. Solucao: usar `setPageState(1)` diretamente ou adicionar `pagination.setPage` ao array com um ref estavel. A abordagem mais simples: incluir `pagination.setPage` na lista de deps e remover o eslint-disable - nao causa loop porque setPage so muda quando totalPages muda

### 5.3 Fire-and-forget no process-spreadsheet
- **Bug**: O `.then()/.catch()` nas linhas 191-217 nao verifica se o response contém um erro da edge function (status 4xx/5xx retorna em `response.error`, nao lanca excecao)
- **Risco**: Se a edge function retorna erro no body (ex: `{ error: "..." }`), o `.then()` executa e invalida queries sem tratar o erro. O upload fica como "ready" sem ter sido processado
- **Correcao**: Dentro do `.then()`, verificar `response.error` e tratar como erro (marcar upload como "error" e mostrar toast)

### 5.4 useEffect de totalCount com dependencias incompletas
- **Bug**: Linha 132 `[uploadsQuery.data?.totalCount]` - falta `pagination` nas dependencias
- **Correcao**: Nao e necessario adicionar `pagination` pois so queremos reagir a mudancas no totalCount. O lint warning pode ser ignorado aqui, mas o ideal e referenciar `pagination.totalCount` explicitamente para clareza. Alternativa: comparar diretamente sem o `!==` guard

## Mudancas Planejadas

### Arquivo: `src/hooks/useUploads.ts`

1. **Fallback para PDV null** (linhas 117-120): Adicionar tratamento no mapeamento de uploads para quando `upload.pdv` e null (PDV deletado)

```
uploads = uploadsData.map((upload) => ({
  ...upload,
  pdv: upload.pdv || { name: "PDV removido", machine_id: "-" },
  uploader: profilesMap.get(upload.uploaded_by) || { name: "Usuario" },
})) as UploadListItem[];
```

2. **Remover eslint-disable** (linha 67): Incluir `pagination.setPage` no array de dependencias

3. **Verificar response.error no process-spreadsheet** (linhas 193-205): Adicionar checagem de `response.error` dentro do `.then()` para capturar erros da edge function que nao lancam excecao

```
.then(async (response) => {
  if (response.error) {
    console.error("Spreadsheet processing error:", response.error);
    await supabase
      .from("uploads")
      .update({ status: "error", error_message: response.error.message || "Erro ao processar" })
      .eq("id", insertedUpload.id);
    queryClient.invalidateQueries({ queryKey: ["uploads"] });
    return;
  }
  // ... rest of success handling
})
```

4. **Adicionar pagination.totalCount ao useEffect** (linha 132): Incluir nas dependencias para satisfazer o linter

### Arquivo: `src/pages/Uploads.tsx`

5. **Proteger acesso a pdv.name no delete dialog** (linha 433): Ja coberto pelo fallback no hook, mas adicionar optional chaining como seguranca extra: `deletingUpload?.pdv?.name`

## Arquivos Impactados

| Arquivo | Acao |
|---------|------|
| `src/hooks/useUploads.ts` | Corrigir 4 problemas: PDV null, eslint-disable, response.error, deps do useEffect |
| `src/pages/Uploads.tsx` | Adicionar optional chaining no delete dialog |

## Impacto
- Zero mudancas visuais
- Previne crashes quando PDVs sao deletados com uploads existentes
- Captura erros silenciosos da edge function process-spreadsheet
- Remove eslint-disable desnecessario

