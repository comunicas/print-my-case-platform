
# Corrigir erro "[object Object]" no upload de vendas

## Problema identificado

Ao tentar subir a planilha do Tatuapé, o toast de erro exibe "Erro inesperado - [object Object]" porque a funcao `parseUploadError` nao extrai corretamente a mensagem de erros que sao objetos simples do Supabase (nao instancias de `Error`).

O Supabase retorna erros como `{message: "...", statusCode: 409}` ou `{error: "...", status: 403}`. O codigo atual faz `String(error)` que resulta em `"[object Object]"`.

A edge function `process-spreadsheet` nao aparece nos logs, indicando que o erro ocorre **antes** do processamento — provavelmente no upload do arquivo ao storage ou na insercao do registro na tabela `uploads`.

## Solucao

### 1. Corrigir `parseUploadError` para extrair mensagens de objetos

**Arquivo:** `src/lib/errors/uploadErrors.ts`

Alterar a extracao da mensagem de erro (linha 15) para lidar com objetos simples:

```typescript
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    // Supabase retorna { message, statusCode } ou { error, status }
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.error_description === 'string') return obj.error_description;
    try { return JSON.stringify(error); } catch { /* fall through */ }
  }
  return String(error);
}
```

Usar `extractErrorMessage` em ambas as funcoes `parseUploadError` e `parseDeleteError`.

### 2. Adicionar log de debug no `useUploads.ts`

**Arquivo:** `src/hooks/useUploads.ts`

Adicionar `console.error` no `onError` da mutacao `createUpload` para capturar o erro real:

```typescript
onError: (error) => {
  console.error("[createUpload] Error object:", error, typeof error);
  const parsedError = parseUploadError(error);
  // ...
}
```

Isso garantira que, mesmo se o erro voltar a ocorrer, teremos a informacao completa nos logs do console.

## Detalhes tecnicos

- **Arquivos modificados:** 2 (`src/lib/errors/uploadErrors.ts`, `src/hooks/useUploads.ts`)
- **Risco:** Baixo — apenas melhora a extracao de mensagens de erro, sem alterar logica de negocio
- **Impacto:** O usuario vera a mensagem real do erro em vez de "[object Object]", permitindo diagnosticar e resolver o problema do upload
