

# Corrigir Datas dos Lancamentos Financeiros (+1 ano)

## Problema Identificado

Os lancamentos foram inseridos com datas de DEZ/2024, JAN/2025 e FEV/2025, mas as vendas reais (sales_records) estao em DEZ/2025, JAN/2026 e FEV/2026. O Financeiro busca os lancamentos pelo mes corrente da tela, entao nao encontra nada.

**Evidencia**: A tela busca `reference_month=eq.2026-01-01` e recebe array vazio `[]`, enquanto os dados existem em `reference_month=2025-01-01`.

## Correcao

Executar 3 UPDATEs para mover as datas +1 ano:

### Tiete Plaza Shopping (org: a1b2c3d4...)

| De | Para |
|----|------|
| 2024-12-01 | 2025-12-01 |
| 2025-01-01 | 2026-01-01 |
| 2025-02-01 | 2026-02-01 |

### Boulevard Tatuape (org: 56bf08d1...)

| De | Para |
|----|------|
| 2025-01-01 | 2026-01-01 |
| 2025-02-01 | 2026-02-01 |

## Implementacao

Dois comandos UPDATE na tabela `financial_entries`:

```text
-- Tiete: mover +1 ano
UPDATE financial_entries
SET reference_month = reference_month + interval '1 year'
WHERE organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND pdv_id = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'
  AND reference_month IN ('2024-12-01', '2025-01-01', '2025-02-01');

-- Tatuape: mover +1 ano
UPDATE financial_entries
SET reference_month = reference_month + interval '1 year'
WHERE organization_id = '56bf08d1-6843-43ef-a880-776acafe8609'
  AND pdv_id = '72811872-2b5d-4db6-afba-46a5e0d55d9a'
  AND reference_month IN ('2025-01-01', '2025-02-01');
```

Nenhuma alteracao de codigo necessaria. Apos o UPDATE, o Financeiro exibira as despesas corretamente ao navegar para DEZ/25, JAN/26 e FEV/26.
