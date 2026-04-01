

## Exportar Mapa de Estoque em XLSX com Formatação e Cores

### Contexto

O projeto já tem `exceljs` instalado. O botão "Exportar" atual gera CSV. Vamos substituir o dropdown por um menu com duas opções (CSV e XLSX).

### Alterações

**1. `src/components/stock/StockGridView.tsx`**

- Substituir o botão simples "Exportar" por um `DropdownMenu` com duas opções: "Exportar CSV" e "Exportar XLSX"
- Extrair a lógica de preparação dos dados (sort, map) para uma função compartilhada `getExportData()`
- Adicionar `handleExportXlsx()` que usa `exceljs` para gerar um arquivo `.xlsx` formatado

**2. Lógica do XLSX (`handleExportXlsx`)**

- Criar workbook com uma sheet "Estoque"
- Header com fundo escuro (azul marinho), texto branco e fonte bold
- Colunas com largura ajustada automaticamente
- Cada linha colorida conforme o status do slot:
  - **Perfeito** (5+): fundo verde claro
  - **Acompanhar** (3-4): fundo azul claro
  - **Atenção** (1-2): fundo laranja claro
  - **Repor** (0): fundo vermelho claro
- Coluna "Status" com texto na cor correspondente (verde/azul/laranja/vermelho)
- Bordas finas em todas as células
- Auto-filter no header
- Download via `Blob` com nome `estoque-mapa-YYYY-MM-DD.xlsx`

### Resultado

O botão "Exportar" abre um dropdown com CSV (atual) e XLSX (novo, com cores e formatação profissional).

