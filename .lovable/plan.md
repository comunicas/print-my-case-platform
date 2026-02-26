

# Evolucao do Modulo Financeiro - Baseado nos Dados Reais do Tiete

## Analise da Planilha Real

A planilha mostra uma estrutura mais rica do que a implementacao atual:

### Diferencas identificadas

| Aspecto | Implementacao Atual | Planilha Real |
|---------|-------------------|---------------|
| Deducoes da Venda | Apenas automatico (refund_amount) | Tambem manual: CMV (R$2.500), STONE (R$447) |
| Linhas individuais | Ocultas - so mostra totais | Cada despesa aparece indentada abaixo do total da categoria |
| Comparacao mensal | Um mes por vez | 3 meses lado a lado (DEZ, JAN, FEV) |
| Filtro PDV | Nao implementado na pagina | Dropdown "Tiete" no topo |
| Categorias | 2 (implantacao, fixas) | 3 (deducoes, implantacao, fixas) |

### Dados reais do Tiete (referencia)

**Deducoes da Venda:**
- CMV: R$2.500/mes (constante)
- STONE (taxa maquininha): variavel

**Despesas Implantacao (DEZ apenas):**
- Rrt: R$110
- Seguro: R$1.200
- Logistica: R$600
- VM Integrador: R$1.800
- Syrlei: R$3.000
- Tecnico: R$500
- Camera: R$280
- Roteador: R$460

**Despesas Fixas (recorrentes):**
- Aluguel: R$3.000
- Licenciamento: R$550
- Internet: R$70
- Limpeza: R$80
- Marketing: R$300

---

## Plano de Alteracoes

### 1. Banco de Dados - Nova categoria "deducoes"

Atualizar o CHECK constraint da coluna `category` em `financial_entries` para aceitar 3 valores:

```sql
ALTER TABLE financial_entries DROP CONSTRAINT financial_entries_category_check;
ALTER TABLE financial_entries ADD CONSTRAINT financial_entries_category_check 
  CHECK (category IN ('deducoes', 'implantacao', 'fixas'));
```

### 2. Schema Zod - Adicionar categoria "deducoes"

Atualizar `src/lib/schemas/financial.ts` para incluir `"deducoes"` no enum.

### 3. DRETable - Mostrar linhas individuais expandiveis

Redesenhar `DRETable.tsx` para:
- Cada secao (Deducoes, Implantacao, Fixas) mostra o total em negrito
- Abaixo do total, listar cada entrada individual indentada (como na planilha)
- Usar `Collapsible` para expandir/recolher as linhas de cada secao
- Deducoes = entradas manuais da categoria "deducoes" (CMV, STONE, etc.)
- Faturamento Bruto continua automatico (sales_records)

### 4. useDRE - Incluir deducoes manuais

Atualizar `useDRE.ts`:
- Remover calculo automatico de deducoes via `refund_amount` (ou somar ambos)
- Adicionar `totalDeducoes` vindo das entries com category="deducoes"
- Expor as entries agrupadas por categoria para o DRETable renderizar as linhas

### 5. useFinancialEntries - Calcular total de deducoes

Adicionar `totalDeducoes` ao hook, somando entries com `category === "deducoes"`.

### 6. FinancialEntryForm - Opcao "Deducoes da Venda"

Adicionar `SelectItem value="deducoes"` no formulario com label "Deducoes da Venda".

### 7. Filtro por PDV na pagina

Adicionar o componente `PDVFilter` no topo da pagina `/financeiro` e passar o `pdvId` selecionado para `useDRE` e `useFinancialEntries`.

### 8. Comparacao multi-mes (fase futura)

Nao sera implementado agora para manter o escopo controlado. Pode ser adicionado depois como uma tabela com 3 colunas de meses.

---

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| Migration SQL | Atualizar CHECK constraint para incluir "deducoes" |
| `src/lib/schemas/financial.ts` | Adicionar "deducoes" ao enum |
| `src/hooks/useFinancialEntries.ts` | Adicionar `totalDeducoes` |
| `src/hooks/useDRE.ts` | Usar deducoes manuais + expor entries agrupadas |
| `src/components/financeiro/DRETable.tsx` | Linhas individuais expandiveis por categoria |
| `src/components/financeiro/FinancialEntryForm.tsx` | Adicionar opcao "Deducoes da Venda" |
| `src/components/financeiro/FinancialEntriesList.tsx` | Adicionar label "Deducoes" |
| `src/pages/Financeiro.tsx` | Adicionar filtro PDV |

