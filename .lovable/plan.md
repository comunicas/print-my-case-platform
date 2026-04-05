

## Etapa 4 — Simplificar RPCs e Frontend

### Situação Atual

O banco agora contém **apenas valores canônicos PT-BR**:
- **status**: `Concluído` (único valor presente)
- **payment_method**: `Cartão de Crédito`, `Cortesia`, `Cupom`, `Não informado`

Porém as RPCs ainda filtram por variantes inglês+português (`'Completed', 'Pago', 'Concluído'`, `'creditCard', 'debitCard', ...`), e o frontend mantém mapeamentos redundantes para variantes que não existem mais.

---

### Alterações

**1. Migration SQL — Simplificar as 2 RPCs**

Recriar `get_dre_sales_summary` e `get_annual_dre_summary` com filtros apenas nos valores canônicos:

- `status IN ('Concluído')` (remover `Completed`, `Pago`)
- `payment_method IN ('Cartão de Crédito', 'Cartão de Débito')` (remover `creditCard`, `debitCard`, `credit_card`, `debit_card`)

**2. Frontend — Simplificar `SalesRecordsTab.tsx`**

Reduzir os mapeamentos de labels e cores:

| Mapa atual | Entradas | Simplificado |
|------------|----------|-------------|
| `statusLabels` | 7 entradas (EN+PT) | 4 entradas (só PT) |
| `statusColors` | 7 entradas (EN+PT) | 4 entradas (só PT) |
| `paymentMethodLabels` | 7 entradas (EN+PT) | 4 entradas (só PT canônico → label curto) |

Novos mapeamentos simplificados:
```text
statusLabels:
  Concluído → Concluído
  Cancelado → Cancelado
  Pendente  → Pendente
  Reembolsado → Reembolsado

paymentMethodLabels:
  Cartão de Crédito → Crédito
  Cartão de Débito  → Débito
  PIX → PIX
  Cortesia → Cortesia
  Cupom → Cupom
  Não informado → N/I
```

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Recriar 2 RPCs com filtros canônicos |
| `src/components/upload/SalesRecordsTab.tsx` | Reduzir mapeamentos de 7→4 entradas |

### Resultado

- RPCs mais simples e fáceis de manter
- Frontend sem mapeamentos de tradução EN→PT desnecessários
- Código preparado para a Etapa 5 (rotina de limpeza de uploads)

