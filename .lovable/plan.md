

## Revisão: Locale dos Meses + Índices na Home

### Problemas Identificados

1. **Meses em inglês** na tabela de Evolução Mensal — `format(month, "MMM/yy")` gera "Feb/26" ao invés de "Fev/26". Falta `{ locale: ptBR }`.
2. **Índices financeiros já estão na Home** — o `FinancialSummaryCard` está integrado corretamente no `Index.tsx` (linha 338). Nenhuma alteração necessária nesse ponto.

### Alterações

1. **`src/hooks/useMonthlyDRESummary.ts`** — Importar `ptBR` de `date-fns/locale` e usar `format(month, "MMM/yy", { locale: ptBR })` para gerar labels em português (Fev, Mar, Abr...).

