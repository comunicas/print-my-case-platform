

# Code Review Completo - Checklist por Pagina

## Fase 1: Correcao de Bugs e Erros Ativos

Problemas que geram warnings/erros no console ou comportamento incorreto.

### 1.1 OrgDetailDialog - Warning de Ref no Console
- **Bug**: `Warning: Function components cannot be given refs` no `Select` dentro de `OrgDetailDialog`
- **Causa**: O componente `Select` do Radix UI esta recebendo uma ref indiretamente (via `CardContent`)
- **Correcao**: Verificar e ajustar como o `Select` de role e renderizado dentro dos cards de usuario
- **Arquivo**: `src/components/settings/OrgDetailDialog.tsx`

### 1.2 UploadDialog - useEffect com dependencia faltando
- **Bug**: `useEffect` na linha 87-90 depende de `type` mas tambem usa `file` sem lista-lo como dependencia, causando stale closure
- **Correcao**: Adicionar `file` ao array de dependencias ou usar ref
- **Arquivo**: `src/components/upload/UploadDialog.tsx`

### 1.3 UploadDialog - Periods gerados no escopo do modulo
- **Bug**: `const periods = generatePeriods()` na linha 65 e executado uma unica vez no carregamento do modulo. Se o usuario ficar com a app aberta na virada do mes, os periodos ficam desatualizados
- **Correcao**: Mover para dentro do componente com `useMemo`
- **Arquivo**: `src/components/upload/UploadDialog.tsx`

### 1.4 useUploads - Chamada de setState fora do render
- **Bug**: Linhas 128-130 chamam `pagination.setTotalCount` diretamente no corpo do componente (fora de useEffect), o que pode causar re-render loop
- **Correcao**: Mover para `useEffect` que depende de `uploadsQuery.data`
- **Arquivo**: `src/hooks/useUploads.ts`

---

## Fase 2: Dashboard (Index.tsx)

### Checklist:
- [ ] **Tamanho do arquivo**: 523 linhas - arquivo muito grande, candidato a refatoracao
- [ ] **Imports nao usados**: Verificar `Ban`, `RotateCcw` e outros icones - todos parecem em uso
- [ ] **localStorage duplicado**: `dashboard-date-range` e `dashboard-consolidated-open` - logica de persistencia duplicada entre useEffect e useState initializer. Extrair para custom hook `useLocalStorageState`
- [ ] **Inline logic repetida**: `selectedPdvId !== 'all' ? selectedPdvId : undefined` aparece 3x (linhas 156, 157, 485, 506). Extrair para variavel
- [ ] **useDashboard query key**: A query key na linha 73 tem 8 elementos incluindo ISOs de datas - muito granular, pode causar re-fetches desnecessarios
- [ ] **KPI object default**: O objeto fallback `kpis` (linhas 208-223) deveria ser uma constante fora do componente
- [ ] **Trend calculations**: 5 chamadas a `calculateTrend` inline - poderia ser um `useMemo` unico retornando todos os trends

### Acoes:
1. Extrair constante `DEFAULT_KPIS`
2. Extrair `effectivePdvId` em variavel reutilizavel
3. Criar `useLocalStorageState` hook para persistencia
4. Considerar extrair filtros para subcomponente `DashboardFilters`

---

## Fase 3: Estoque - Tabela (Stock.tsx + ProductStockTable.tsx)

### Checklist:
- [ ] **Stock.tsx**: Limpo e bem estruturado (112 linhas). Sem problemas criticos
- [ ] **ProductStockTable.tsx**: Paginacao manual client-side (pageSize=10) quando poderia reutilizar `DataPagination`
- [ ] **ref mutation**: Linha 199 `ref={el => rowRefs.current[index] = el}` - atribuicao direta no ref dentro de map. Poderia causar issues em fast re-renders
- [ ] **statusOrder inline**: Objeto `statusOrder` (linha 58) recriado a cada sort - extrair como constante
- [ ] **StockFiltersContext**: Compartilha filtros entre tabs - verificar se ha memory leaks ao trocar tabs

### Acoes:
1. Extrair `statusOrder` para constante
2. Considerar migrar paginacao para `DataPagination` para consistencia
3. Memoizar `SortIcon` component

---

## Fase 4: Estoque - Mapa (StockGridView.tsx)

### Checklist:
- [ ] **Tamanho**: 338 linhas - razoavel mas com muita logica inline
- [ ] **STORAGE_KEY constante**: Corretamente extraida
- [ ] **canNavigatePrev/Next hardcoded**: Linhas 144-145 `const canNavigatePrev = true` - se e sempre true, nao precisa ser prop da modal
- [ ] **useSwipeGesture**: Swipe no grid principal pode conflitar com scroll horizontal em mobile
- [ ] **registerSlotRef callback**: Cria closures para cada slot no map - considerar otimizacao
- [ ] **Animacoes CSS**: `animate-content-swap` e `animate-scale-resize` - verificar se estao definidas no tailwind config

### Acoes:
1. Remover props `canNavigatePrev`/`canNavigateNext` se sempre true
2. Verificar definicoes de animacoes customizadas no tailwind

---

## Fase 5: Uploads (Uploads.tsx + useUploads.ts)

### Checklist:
- [ ] **Uploads.tsx**: 455 linhas - arquivo grande mas bem organizado
- [ ] **Empty state apos filtros**: Posicao correta (apos pagination)
- [ ] **useUploads.ts**: `supabase.functions.invoke` com `.then()/.catch()` (linhas 189-215) - fire-and-forget pattern que pode perder erros em producao
- [ ] **eslint-disable**: Linha 67 `// eslint-disable-next-line react-hooks/exhaustive-deps` - indica problema de dependencias no useEffect
- [ ] **Upload query join**: `pdv:pdvs(name, machine_id)` - join pode falhar se PDV foi deletado, retornando null
- [ ] **Uploader profiles fetch**: Query separada para nomes de uploaders (linhas 110-113) - poderia ser join no SQL

### Acoes:
1. Tratar PDV null no mapeamento de uploads (pdv deletado)
2. Remover eslint-disable e corrigir dependencias
3. Adicionar error boundary ou fallback para process-spreadsheet

---

## Fase 6: Marketing - Cupons (CouponsSettings.tsx)

### Checklist:
- [ ] **forwardRef desnecessario**: Componente usa `React.forwardRef` mas a ref so e usada para scroll (linha 183 `ref={ref}`). Verificar se algum pai realmente passa ref
- [ ] **editingPdv state gerenciamento**: Estado de edicao por PDV usa objeto Record - complexo mas funcional
- [ ] **fileInputRefs**: Uso correto de refs para inputs de arquivo
- [ ] **getEditingValue funcao**: Chamada 3x no render com type assertion (`as string`, `as string | null`) - poderia ser tipada melhor
- [ ] **Admin vs readonly mode**: Duplicacao de layout entre admin e readonly - considerar extrair

### Acoes:
1. Remover `forwardRef` se nao ha caller passando ref
2. Melhorar tipagem de `getEditingValue`

---

## Fase 7: Marketing - Midias (MediaSettings.tsx)

### Checklist:
- [ ] **Tamanho**: 454 linhas - grande, mas boa separacao de responsabilidades
- [ ] **Lightbox state**: Controlado localmente - correto
- [ ] **handleDragEnd wrapped in useCallback**: Retorna funcao dentro de funcao - padrao correto para DnD
- [ ] **Linha vazia 73**: Linha em branco desnecessaria apos o `useSensors`
- [ ] **Readonly mode com grid flat**: Boa UX, sem issues
- [ ] **formatFileSize utility**: Funcao inline - deveria ser extraida para `lib/utils`

### Acoes:
1. Mover `formatFileSize` para `lib/utils.ts`
2. Remover linha em branco desnecessaria

---

## Fase 8: Organizacoes (Organizations.tsx + OrgDetailDialog.tsx)

### Checklist:
- [ ] **Organizations.tsx**: Bem estruturado, 452 linhas
- [ ] **OrgDetailDialog.tsx**: 697 linhas - MUITO grande. Contem logica de CRUD de usuarios, PDVs, roles, transferencias tudo inline
- [ ] **updateRoleMutation**: DELETE + INSERT sem transacao - risco de estado inconsistente se INSERT falha apos DELETE
- [ ] **Multiple useState**: 15+ estados no OrgDetailDialog - candidato a `useReducer`
- [ ] **CreateUserDialog import**: Funciona mas a prop `onSubmit` ignora organizationId pre-configurado? Verificar
- [ ] **Nested dialogs**: OrgDetailDialog abre outros dialogs (edit PDV, delete user, transfer, create user, create PDV) - 6 dialogs aninhados pode causar problemas de z-index e acessibilidade
- [ ] **PLANS constante**: Definida no Organizations.tsx - deveria ser compartilhada (mesma lista usada em outros lugares?)

### Acoes:
1. Extrair mutations para hooks dedicados (ex: `useOrgDetailActions`)
2. Reduzir estados com `useReducer` ou extraindo subcomponentes
3. Considerar transacao no updateRoleMutation (edge function?)

---

## Resumo de Prioridades

| Fase | Prioridade | Esforco | Impacto |
|------|------------|---------|---------|
| Fase 1: Bugs ativos | Alta | Baixo | Corrige erros no console e comportamento |
| Fase 2: Dashboard | Media | Medio | Melhora manutencao do arquivo maior |
| Fase 3: Estoque Tabela | Baixa | Baixo | Consistencia de UI |
| Fase 4: Estoque Mapa | Baixa | Baixo | Limpeza de props inuteis |
| Fase 5: Uploads | Media | Medio | Robustez de error handling |
| Fase 6: Marketing Cupons | Baixa | Baixo | Limpeza de codigo |
| Fase 7: Marketing Midias | Baixa | Baixo | Organizacao de utils |
| Fase 8: Organizacoes | Alta | Alto | OrgDetailDialog precisa de refatoracao significativa |

## Ordem de Execucao Recomendada

1. **Fase 1** - Corrigir bugs ativos (impacto imediato, baixo risco)
2. **Fase 8** - Refatorar OrgDetailDialog (maior divida tecnica)
3. **Fase 5** - Robustez de uploads
4. **Fase 2** - Limpeza do Dashboard
5. **Fases 3, 4, 6, 7** - Podem ser feitas em paralelo (baixo risco)

