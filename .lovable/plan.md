

## Exibir toast de erro ao detectar PDV incorreto no upload

### Problema
Quando a edge function rejeita o upload por `device_id` incorreto, o erro é salvo no banco e logado no console, mas **nenhum toast** é exibido ao usuário. A tela fica sem feedback visual.

### Alteração

**`src/hooks/useUploads.ts`** — Adicionar `toast.error()` nos dois blocos de tratamento de erro (linhas 195-205 e 220-230):

- No bloco `if (response.error)` (linha 195): extrair a mensagem de erro do response e exibir um `toast.error` com título "Erro no upload" e a descrição retornada pela edge function
- No bloco `.catch()` (linha 220): mesma lógica de toast

A mensagem da edge function já vem formatada em português (ex: _"O ID do dispositivo na planilha (1001018) não corresponde ao PDV selecionado..."_), então basta exibi-la diretamente no toast.

### Código esperado

```typescript
// Dentro do bloco if (response.error) — após o console.error
toast.error("Erro no upload", {
  description: response.error.message || "Erro ao processar planilha",
  duration: 8000,
});

// Dentro do .catch — após o console.error
toast.error("Erro no upload", {
  description: err?.message || "Erro ao processar planilha",
  duration: 8000,
});
```

### Resultado
Ao subir planilha com device_id errado, o usuário verá imediatamente um toast vermelho com a mensagem explicando qual device_id foi encontrado e qual era esperado.

