

## Diagnóstico: Cache do React Query mostrando dados antigos

### Problema

O banco está limpo (0 registros), mas o frontend ainda mostra 1 produto (iPhone 15 Plus, slot 34) porque o **React Query mantém dados em cache** por até 30 minutos.

### Configurações que causam isso

| Config | Valor | Efeito |
|--------|-------|--------|
| `staleTime` (global) | 5 min | Não refaz query por 5 min |
| `gcTime` (global) | 30 min | Mantém cache mesmo sem uso por 30 min |
| `placeholderData` em `useSlotsData` | `previousData` | Mostra dados anteriores enquanto recarrega |
| `refetchOnWindowFocus` | `false` | Trocar de aba não atualiza |

### Não há dados mockados

Não existe nenhum dado hardcoded ou mock no código. O problema é puramente cache do React Query.

### Possível causa adicional

A API `ingest-stock` do Boulevard pode ter **re-ingerido** o registro do slot 34 após a limpeza (ela roda automaticamente). Isso explicaria por que aparece exatamente 1 produto.

### Solução imediata

Um **hard refresh** (Ctrl+F5) no navegador limpa o cache do React Query e mostra o estado real do banco.

### Melhoria opcional no código

Nenhuma alteração de código é necessária. O cache de 5 minutos é adequado para produção. Se quiser, posso reduzir o `staleTime` dos hooks de estoque para tornar as atualizações mais rápidas após uploads.

