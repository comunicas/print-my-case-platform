

## Corrigir cores inconsistentes no badge de Status

### Causa raiz

Dois problemas:

1. **Conflito de classes CSS**: O `Badge` usa `variant="default"` implicitamente, que aplica `bg-primary text-primary-foreground`. A `className` customizada (ex: `bg-emerald-100`) compete com essas classes base. O Tailwind não garante ordem de precedência quando duas classes de background coexistem.

2. **Case sensitivity**: Se o campo `status` no banco vier com casing diferente de `"Completed"` (ex: `"completed"`, `"COMPLETED"`), o lookup no `statusColors` falha e aplica o fallback cinza.

### Alteração

**`src/components/upload/SalesRecordsTab.tsx`**

- Usar `variant="outline"` ou `variant="secondary"` no `Badge` para remover o `bg-primary` conflitante, e deixar a `className` customizada ter precedência
- Normalizar o status com `.toLowerCase()` ou lookup case-insensitive antes de buscar no mapa de cores
- Adicionar mais variações possíveis no mapa (ex: `"completed"`, `"Concluído"`)

