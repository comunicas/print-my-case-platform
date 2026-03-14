

## Diagnóstico: Consumo de Dados de Vendas

As tabelas `sales_records` estão sendo consumidas **corretamente** pela aplicação:
- Requisições retornam HTTP 200 com dados válidos
- Filtros de status (`Completed`, `Pago`, `Concluído`), período e PDV funcionam como esperado
- Sem erros de console relacionados a dados

## Correção Necessária: Erro de Build

Há um erro de TypeScript não relacionado ao consumo de dados que precisa ser corrigido:

**Arquivo**: `src/components/marketing/lightbox/MediaLightbox.tsx` (linhas 28-29)

**Problema**: `NodeJS.Timeout` não é reconhecido no ambiente browser/Vite.

**Correção**: Substituir `NodeJS.Timeout` por `ReturnType<typeof setTimeout>`, que funciona tanto em Node quanto no browser.

```typescript
// De:
const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);
const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

// Para:
const slideshowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const progressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

