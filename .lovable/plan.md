
# Inserir Dados Financeiros Reais - Tiete + Tatuape

## Estado Atual no Banco

- **Tiete Plaza Shopping**: 0 entradas (nenhum dado persistiu)
- **Boulevard Tatuape FEV/25**: 8 entradas (corretas)
- **Boulevard Tatuape JAN/25**: 0 entradas (falta CMV R$ 3.600)

## Dados a Inserir

### Tiete Plaza Shopping

**PDV**: `b2c3d4e5-f6a7-8901-bcde-f23456789012`
**Org**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
**Created by**: `0a3d0762-7635-4732-a9ca-0c3fb31381dc`

**DEZ/2024** (reference_month: 2024-12-01) - 15 entradas

| Categoria | Descricao | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 2.500 |
| deducoes | STONE | 447 |
| implantacao | Rrt | 110 |
| implantacao | Seguro | 1.200 |
| implantacao | Logistica | 600 |
| implantacao | VM - Integrador | 1.800 |
| implantacao | Syrlei | 3.000 |
| implantacao | Tecnico | 500 |
| implantacao | Camera | 280 |
| implantacao | Roteador | 460 |
| fixas | Aluguel | 3.000 |
| fixas | Licenciamento | 550 |
| fixas | Internet (11) 94724-5189 | 70 |
| fixas | Limpeza | 80 |
| fixas | Marketing | 300 |

**JAN/2025** (reference_month: 2025-01-01) - 7 entradas

| Categoria | Descricao | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 2.500 |
| deducoes | STONE | 382 |
| fixas | Aluguel | 3.000 |
| fixas | Licenciamento | 550 |
| fixas | Internet (11) 94724-5189 | 70 |
| fixas | Limpeza | 80 |
| fixas | Marketing | 300 |

**FEV/2025** (reference_month: 2025-02-01) - 7 entradas

| Categoria | Descricao | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 2.500 |
| deducoes | STONE | 279 |
| fixas | Aluguel | 3.000 |
| fixas | Licenciamento | 550 |
| fixas | Internet (11) 94724-5189 | 70 |
| fixas | Limpeza | 80 |
| fixas | Marketing | 300 |

---

### Boulevard Tatuape (somente JAN/25 faltante)

**PDV**: `72811872-2b5d-4db6-afba-46a5e0d55d9a`
**Org**: `56bf08d1-6843-43ef-a880-776acafe8609`
**Created by**: `0f365ed3-f8b7-4d85-bb3b-54ca74be6c32`

**JAN/2025** (reference_month: 2025-01-01) - 1 entrada

| Categoria | Descricao | Valor |
|-----------|-----------|-------|
| deducoes | CMV | 3.600 |

---

## Resumo

| PDV | Mes | Entradas |
|-----|-----|----------|
| Tiete | DEZ/24 | 15 |
| Tiete | JAN/25 | 7 |
| Tiete | FEV/25 | 7 |
| Tatuape | JAN/25 | 1 |
| **Total** | | **30** |

## Implementacao

Uma unica operacao de INSERT com 30 linhas na tabela `financial_entries`. Nenhuma alteracao de codigo necessaria.

## Validacao Esperada (DRE)

Apos a insercao, a DRE do Tiete deve exibir:

| | DEZ/24 | JAN/25 | FEV/25 |
|--|--------|--------|--------|
| Faturamento Bruto | 14.889 | 12.722 | 9.297 |
| Deducoes (auto + manual) | 2.947 | 2.882 | 2.779 |
| Receita Liquida | ~7.942 | ~5.840 | ~2.518 |
| Implantacao | 7.950 | 0 | 0 |
| Fixas | 4.000 | 4.000 | 4.000 |

Nota: O faturamento bruto e as deducoes automaticas (reembolsos) vem da tabela `sales_records`. Os valores de CMV e STONE sao entradas manuais que se somam aos reembolsos automaticos na linha de deducoes.
