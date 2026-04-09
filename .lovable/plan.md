

## Revisao Completa da Experiencia Mobile

### Problemas Identificados

1. **Tabela de Estoque (Tabela)**: Colunas Vendas, Estoque, Slots e Acoes ficam cortadas/invissiveis no mobile — apenas Slot, Produto e Status aparecem
2. **Aba Compras**: Botoes "Tabela/Ranking" e "Registrar Compra" ficam apertados; tabela de compras tambem corta colunas
3. **Filtros na pagina de Estoque**: 5 filtros empilhados verticalmente ocupam ~250px de altura antes do conteudo real
4. **Dashboard - Date presets**: 5 botoes de periodo + calendar picker em uma linha quebram em 2 linhas de forma desorganizada
5. **Dashboard - Visao Consolidada**: 5 metricas em grid 2-col deixam "Ticket Medio Global" sozinho na ultima linha
6. **PreStockRanking cards**: Valor pendente e texto "pend./aloc." truncam em telas <390px
7. **Tabela PreStock (Compras)**: 8 colunas, todas cortadas no mobile

---

### Mudancas Planejadas

#### 1. Tabela de Estoque — Layout mobile com cards
**Arquivo:** `src/components/stock/ProductStockTable.tsx`

No mobile, substituir a tabela por uma lista de cards compactos. Cada card mostra:
- Linha 1: Slot (mono) + Produto (brand logo + model) + Status badge
- Linha 2: Vendas (icone + numero) + Estoque (progress bar + X/Y) + botao Eye

Manter a tabela completa para `sm:` e acima. Usar `useIsMobile()` para alternar.

#### 2. Filtros compactos no mobile
**Arquivo:** `src/components/stock/StockFilters.tsx`

Agrupar filtros secundarios (Marca, Status, Vendas) dentro de um `Collapsible` no mobile com botao "Mais filtros" + badge com contador de filtros ativos. PDV e busca ficam sempre visiveis.

#### 3. Aba Compras — Botoes e tabela mobile
**Arquivo:** `src/components/upload/PreStockTab.tsx`

- Botoes Tabela/Ranking: usar largura total `w-full` no mobile com icones maiores
- Botao "Registrar Compra": colocar em linha separada no mobile, `w-full`
- Tabela de compras: no mobile, mostrar apenas Produto, Restante, Status com layout card similar ao item 1

#### 4. PreStockRanking — Ajuste de overflow
**Arquivo:** `src/components/upload/PreStockRanking.tsx`

- Diminuir texto do rank `#N` de `text-lg` para `text-base` no mobile
- Mover valor pendente para linha separada abaixo do nome no mobile
- Texto "pend./aloc." usar `text-[10px]` e quebrar em 2 linhas se necessario

#### 5. Dashboard — Date presets scrollavel
**Arquivo:** `src/components/dashboard/DateRangeFilter.tsx`

Envolver os botoes de preset em um container com `overflow-x-auto scrollbar-hide` e `flex-nowrap` no mobile, permitindo scroll horizontal ao inves de wrap.

#### 6. Dashboard — KPI Cards touch targets
**Arquivo:** `src/components/dashboard/KPICard.tsx`

- Aumentar padding vertical no mobile: `py-3` → `py-4`
- Garantir `min-h-[88px]` para area de toque adequada (44px minimo Apple HIG)

#### 7. Tabela PreStock — Card view no mobile
**Arquivo:** `src/components/upload/PreStockTab.tsx`

Substituir `<Table>` por lista de cards no mobile (detectado via `useIsMobile()`), mostrando: Produto (bold), Status badge, Restante/Comprado, Custo unit., e botao de delete.

---

### Arquivos Impactados

| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `src/components/stock/ProductStockTable.tsx` | Card layout mobile |
| `src/components/stock/StockFilters.tsx` | Filtros colapsaveis |
| `src/components/upload/PreStockTab.tsx` | Botoes full-width + card view para tabela |
| `src/components/upload/PreStockRanking.tsx` | Ajuste de layout em telas estreitas |
| `src/components/dashboard/DateRangeFilter.tsx` | Scroll horizontal nos presets |
| `src/components/dashboard/KPICard.tsx` | Touch targets maiores |

