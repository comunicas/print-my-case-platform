

# Corrigir bug de fuso horario no useAnnualDRE

## Problema

No hook `useAnnualDRE.ts`, as datas retornadas pelo banco (ex: `"2025-12-01"`) sao parseadas com `new Date(str).getMonth()`. Como o JavaScript interpreta datas sem horario como UTC meia-noite, no fuso de Brasilia (UTC-3) o resultado e deslocado: dezembro vira novembro, janeiro vira dezembro do ano anterior, etc.

Este e o mesmo tipo de bug ja documentado no projeto (ver memoria `temporal-analytics-logic`), onde a solucao padrao e usar metodos UTC.

## Solucao

Trocar `getMonth()` por `getUTCMonth()` nas duas ocorrencias em `useAnnualDRE.ts`:

1. **Linha ~87** (mapeamento de vendas):
   ```typescript
   // DE:
   const monthIdx = new Date(s.month_start).getMonth();
   // PARA:
   const monthIdx = new Date(s.month_start).getUTCMonth();
   ```

2. **Linha ~93** (mapeamento de despesas):
   ```typescript
   // DE:
   const monthIdx = new Date(e.reference_month).getMonth();
   // PARA:
   const monthIdx = new Date(e.reference_month).getUTCMonth();
   ```

## Impacto

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useAnnualDRE.ts` | 2 linhas: `getMonth()` -> `getUTCMonth()` |

Nenhuma migration ou alteracao de componente necessaria. Os dados de dezembro de 2025 passarao a aparecer corretamente no mes "Dez" ao visualizar o ano 2025.

