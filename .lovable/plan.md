

## Adicionar Exportação JPG — Checklist de Conferência de Estoque

### O que será feito

Adicionar uma terceira opção no dropdown "Exportar" do Mapa de Estoque: **"Checklist JPG"**. Ao clicar, gera uma imagem JPG simples com formato de lista para conferência física, contendo slot, produto e quantidade — respeitando os filtros ativos.

### Como funciona

Usa a API Canvas do navegador (nativa, sem dependências extras) para desenhar a lista e exportar como `.jpg`. A imagem terá:

```text
┌─────────────────────────────────────┐
│  CHECKLIST DE ESTOQUE               │
│  Boulevard Tatuapé — 05/04/2026     │
│─────────────────────────────────────│
│  SLOT   PRODUTO              QTD   │
│  01     Redmi note14 Pro     3/7   │
│  02     Redmi note14         2/7   │
│  03     Redmi note13 Pro+    5/7   │
│  ...                                │
│─────────────────────────────────────│
│  EXTRA RICARDO JAFET                │
│  SLOT   PRODUTO              QTD   │
│  01     ...                         │
│  ...                                │
└─────────────────────────────────────┘
```

- Agrupado por PDV (quando multi-PDV)
- Ordenado por slot dentro de cada PDV
- Cores: vermelho para qty 0, laranja para 1-2, preto para o resto
- Fonte monoespaçada para alinhamento limpo

### Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/components/stock/StockGridView.tsx` | Adicionar `handleExportJpg` + item no dropdown menu |

### Detalhes técnicos

1. Nova função `handleExportJpg` que:
   - Reutiliza `getExportData()` já existente (respeita filtros)
   - Cria um `<canvas>` offscreen
   - Desenha cabeçalho com título, PDV e data
   - Desenha linhas: `Slot | Produto | Qtd/7`
   - Exporta via `canvas.toBlob('image/jpeg')` → download automático

2. Novo `<DropdownMenuItem>` no menu Exportar com ícone `Image` do lucide-react

