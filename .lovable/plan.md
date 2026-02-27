

# Componentizar e Simplificar Filtros - Plano Revisado

## Diagnostico Completo

Auditoria de todas as paginas com filtros:

| Pagina         | PDV            | Busca              | Selects extras       | Pref. PDV                | Limpar filtros |
|----------------|----------------|--------------------|-----------------------|--------------------------|----------------|
| Dashboard      | PDVFilter      | --                 | DateRangeFilter       | Manual (~20 linhas)      | Nao            |
| Estoque        | PDVFilter (ctx)| Autocomplete       | Brand, Status, Sales, SaleStatus | StockFiltersContext | Sim (botao)    |
| Uploads        | PDVFilter      | Input c/ icone     | Tipo, Status          | useDefaultPdvPreference  | Nao            |
| Financeiro     | PDVFilter      | --                 | --                    | useDefaultPdvPreference  | Nao            |
| Marketing      | PDVFilter      | --                 | --                    | useDefaultPdvPreference  | Nao            |
| Organizacoes   | --             | Input c/ icone     | --                    | --                       | Nao            |

### Problemas encontrados

1. **Dashboard (Index.tsx)** - Unica pagina que NAO usa `useDefaultPdvPreference`, reimplementa a mesma logica em ~20 linhas (linhas 98-132)
2. **Layout de filtros inconsistente** - Dashboard usa `flex-col sm:flex-row gap-3`, Uploads usa `flex-col gap-3 md:flex-row`, Estoque usa `flex-col sm:flex-row flex-wrap gap-2 sm:gap-3`
3. **Busca duplicada** - Uploads e Organizacoes tem o mesmo padrao de `Input` com icone `Search` posicionado absolutamente (~6 linhas cada)
4. **Select repetitivo** - Uploads tem 2 selects manuais (tipo/status) com ~20 linhas. Estoque tem 4 selects manuais com ~60 linhas
5. **Sem botao "Limpar"** - Uploads e Dashboard nao tem botao para limpar filtros ativos
6. **Organizacoes** - Pagina admin (super_admin only) com busca simples, mesmo padrao de Input+Search duplicado

---

## Plano Dividido em 3 Partes

### Parte 1: Criar componentes base (sem quebrar nada)

Criar 3 componentes reutilizaveis que encapsulam padroes repetidos. Nenhuma pagina e alterada nesta parte.

**Arquivo: `src/components/ui/FilterBar.tsx`**
Wrapper de layout para barras de filtro. Padroniza espacamento, responsividade e botao "Limpar".

```
Props:
- children: ReactNode
- onClear?: () => void
- hasActiveFilters?: boolean
```

Renderiza `div` com `flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center` + botao "Limpar" condicional.

**Arquivo: `src/components/ui/SearchFilter.tsx`**
Input de busca padrao com icone e debounce opcional.

```
Props:
- value: string
- onChange: (value: string) => void
- placeholder?: string
- debounceMs?: number (default 0, sem debounce)
- className?: string
```

Encapsula o padrao `div.relative > Search icon + Input.pl-10` que aparece em Uploads e Organizacoes.

**Arquivo: `src/components/ui/SelectFilter.tsx`**
Select generico para filtros.

```
Props:
- value: string
- onChange: (value: string) => void
- placeholder: string
- options: Array<{ value: string; label: string; icon?: ReactNode }>
- className?: string
- triggerClassName?: string
- testId?: string
```

Encapsula `Select > SelectTrigger > SelectContent > SelectItems` que se repete em Estoque e Uploads.

### Parte 2: Refatorar paginas existentes

Substituir codigo duplicado pelos novos componentes, pagina por pagina.

**2a. `src/pages/Index.tsx` - Unificar preferencia PDV**
- Substituir linhas 98-132 (estado manual + useEffect + handler) por `useDefaultPdvPreference`
- Envolver filtros (DateRangeFilter + PDVFilter) com `FilterBar`
- Manter DateRangeFilter e PDVFilter como estao (sao especializados)
- Reducao: ~20 linhas removidas

**2b. `src/pages/Uploads.tsx` - Usar novos componentes**
- Substituir Input+Search (linhas 205-213) por `SearchFilter`
- Substituir selects de tipo e status (linhas 224-245) por 2x `SelectFilter`
- Envolver tudo com `FilterBar` incluindo botao "Limpar"
- Adicionar logica `hasActiveFilters` (searchQuery ou filterType ou filterStatus diferente de default)
- Reducao: ~25 linhas removidas

**2c. `src/components/stock/StockFilters.tsx` - Usar SelectFilter**
- Substituir os 4 selects manuais (Brand, Status, SalesIndex, SaleStatus) por `SelectFilter`
- Envolver com `FilterBar` (que ja inclui o botao Limpar)
- Manter `ProductSearchAutocomplete` e `PDVFilter` como estao
- Manter tooltip do SaleStatus como esta (caso especial)
- Reducao: ~50 linhas removidas

**2d. `src/pages/Organizations.tsx` - Usar SearchFilter**
- Substituir Input+Search (linhas 173-180) por `SearchFilter`
- Reducao: ~5 linhas removidas

### Parte 3: Consistencia em Financeiro e Marketing

**3a. `src/pages/Financeiro.tsx`**
- Sem mudancas — ja usa PDVFilter e useDefaultPdvPreference corretamente. Layout e simples (PDV + botao) e nao precisa de FilterBar.

**3b. `src/pages/Marketing.tsx`**
- Sem mudancas — mesmo caso do Financeiro. PDVFilter isolado no header, sem necessidade de wrapper.

---

## O que NAO muda

- `PDVFilter` — componente maduro com logica de Auto badge e favoritos
- `DateRangeFilter` — componente especializado com calendario, presets e inputs manuais
- `ProductSearchAutocomplete` — autocomplete com sugestoes de produto
- `StockFiltersContext` — contexto com estado interdependente dos filtros
- `useDefaultPdvPreference` — hook reutilizado, apenas Dashboard passa a usa-lo
- `PublicBrandFilter` — pagina publica com design diferente

## Resumo de arquivos

| Acao    | Arquivo                                   | Parte |
|---------|-------------------------------------------|-------|
| Criar   | `src/components/ui/FilterBar.tsx`         | 1     |
| Criar   | `src/components/ui/SearchFilter.tsx`      | 1     |
| Criar   | `src/components/ui/SelectFilter.tsx`      | 1     |
| Editar  | `src/pages/Index.tsx`                     | 2a    |
| Editar  | `src/pages/Uploads.tsx`                   | 2b    |
| Editar  | `src/components/stock/StockFilters.tsx`   | 2c    |
| Editar  | `src/pages/Organizations.tsx`             | 2d    |

## Beneficios

- ~100 linhas de codigo duplicado removidas
- Layout de filtros padronizado em todas as paginas
- Botao "Limpar filtros" disponivel onde faltava (Uploads)
- Dashboard usando o mesmo hook de preferencia PDV que as outras paginas
- Novos filtros em qualquer pagina futura levam 3 linhas em vez de 15

