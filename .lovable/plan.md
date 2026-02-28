

# Corrigir warnings de lint nos arquivos movidos

## Problemas encontrados

### 1. `ProductRequestsSettings.tsx` - Imports nao usados
- **Linha 1**: `useMemo` importado mas nunca utilizado
- **Linha 32**: `Users` (lucide-react) importado mas nunca utilizado

### 2. Cores hardcoded (`blue-500`, `green-500`)
Apos analise, `bg-blue-500/10` e `bg-green-500/10` sao um padrao consistente no projeto (usados em `ProductAnalyticsKPIs`, `NotificationsPopover`, etc.). **Nao sao warnings reais** -- sao classes utilitarias do Tailwind usadas como convencao de design para KPI cards. Nenhuma alteracao necessaria aqui.

### 3. `ProductRequestDetailModal.tsx` e `CatalogLeadsSettings.tsx`
Sem warnings de lint. Todos os imports estao em uso.

## Mudancas

### Arquivo: `src/components/marketing/ProductRequestsSettings.tsx`

1. Remover `useMemo` do import do React (linha 1)
2. Remover `Users` do import do lucide-react (linha 32)

Resultado: 2 linhas editadas, zero impacto funcional.

