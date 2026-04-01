

## Exportar Mapa de Estoque como Tabela Simples (CSV/XLSX)

### Funcionalidade

Adicionar um botão "Exportar" no header do grid (ao lado dos botões Compacto/Expandido/Fullscreen) que gera uma tabela simples com os dados dos slots visíveis, respeitando os filtros aplicados.

### Formato da tabela exportada

| PDV | Slot | Marca | Modelo | Quantidade | Capacidade | Status |
|-----|------|-------|--------|------------|------------|--------|

### Alterações

**1. `src/components/stock/StockGridView.tsx`**
- Importar `Download` icon do lucide-react
- Adicionar botão "Exportar" no header (junto aos toggles)
- Implementar função `handleExport()` que:
  - Usa `filteredSlots` se filtros ativos, senão `slots`
  - Ordena por PDV → Slot
  - Gera CSV com headers em português
  - Faz download via `Blob` + link temporário
  - Nomeia arquivo: `estoque-mapa-YYYY-MM-DD.csv`
- Mapeia o status de cada slot usando `getProductActionStatus` e `productActionLabels`

### Lógica de exportação

```typescript
const handleExport = () => {
  const dataToExport = hasFilter && filteredSlots ? filteredSlots : slots;
  const sorted = [...dataToExport].sort((a, b) => 
    a.pdvName.localeCompare(b.pdvName) || a.slot.localeCompare(b.slot)
  );
  // Gera CSV com BOM para Excel, download automático
};
```

### Resultado

Botão discreto no header do grid que exporta CSV com os dados filtrados, pronto para abrir no Excel.

