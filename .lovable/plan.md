

# Inserção dos Dados Reais da Planilha no Financeiro

## Dados a Inserir

Baseado nas planilhas enviadas, serão inseridas **34 entradas** no total:

### Tietê Plaza Shopping (PDV: `b2c3d4e5...`, Org: `a1b2c3d4...`)

**DEZ/2024** (`reference_month: 2024-12-01`)

| Categoria | Descrição | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 2.500 |
| deducoes | STONE | 447 |
| implantacao | Rrt | 110 |
| implantacao | Seguro | 1.200 |
| implantacao | Logística | 600 |
| implantacao | VM - Integrador | 1.800 |
| implantacao | Syrlei | 3.000 |
| implantacao | Técnico | 500 |
| implantacao | Câmera | 280 |
| implantacao | Roteador | 460 |
| fixas | Aluguel | 3.000 |
| fixas | Licenciamento | 550 |
| fixas | Internet (11) 94724-5189 | 70 |
| fixas | Limpeza | 80 |
| fixas | Marketing | 300 |

**JAN/2025** (`reference_month: 2025-01-01`)

| Categoria | Descrição | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 2.500 |
| deducoes | STONE | 382 |
| fixas | Aluguel | 3.000 |
| fixas | Licenciamento | 550 |
| fixas | Internet (11) 94724-5189 | 70 |
| fixas | Limpeza | 80 |
| fixas | Marketing | 300 |

**FEV/2025** (`reference_month: 2025-02-01`)

| Categoria | Descrição | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 2.500 |
| deducoes | STONE | 279 |
| fixas | Aluguel | 3.000 |
| fixas | Licenciamento | 550 |
| fixas | Internet (11) 94724-5189 | 70 |
| fixas | Limpeza | 80 |
| fixas | Marketing | 300 |

---

### Boulevard Tatuapé (PDV: `72811872...`, Org: `56bf08d1...`)

**FEV/2025** (`reference_month: 2025-02-01`)

| Categoria | Descrição | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 1.500 |
| deducoes | STONE | 216 |
| implantacao | Diversos | 25 |
| fixas | Aluguel | 4.000 |
| fixas | Licenciamento | 550 |
| fixas | Internet (11) 97837-4557 | 70 |
| fixas | Limpeza | 100 |
| fixas | Marketing | 400 |

---

## Observações

- **JAN/2025 do Tatuapé** não será inserido pois o faturamento era zero e todas as despesas fixas eram zero (PDV ainda não operava)
- Implantação JAN e FEV do Tietê = R$0, então nenhuma entrada de implantação nesses meses
- O `created_by` de cada PDV usará o admin da respectiva organização
- Os dados serão inseridos via ferramenta de insert do banco, sem necessidade de migration

## Implementação

Uma única operação de INSERT com todas as 34 linhas na tabela `financial_entries`.
