

## Correção: Tabela de Vendas com Filtros e Labels Incorretos

### Problemas Encontrados

| Problema | Detalhe |
|----------|---------|
| **Filtro de status não funciona** | O dropdown usa valores em inglês (`Completed`, `Cancelled`, `Refunded`) mas o banco só tem `Concluído`, `Cancelado`, `Pendente`. Filtrar por "Concluído" envia `status=Completed` → 0 resultados. |
| **Método de pagamento cru** | Mostra `creditCard`, `debitCard`, `pix` sem tradução. Deveria exibir "Cartão de Crédito", "Débito", "PIX". |
| **Status "Pendente" ausente no filtro** | Existem 4 registros com status `Pendente` que não aparecem nas opções do filtro. |

### Correção

**Arquivo: `src/components/upload/SalesRecordsTab.tsx`**

1. **Corrigir valores do filtro de status** — usar os valores reais do banco:
```tsx
options={[
  { value: "all", label: "Todos os status" },
  { value: "Concluído", label: "Concluído" },
  { value: "Cancelado", label: "Cancelado" },
  { value: "Pendente", label: "Pendente" },
]}
```

2. **Adicionar mapa de tradução de payment_method**:
```tsx
const paymentMethodLabels: Record<string, string> = {
  creditCard: "Crédito",
  debitCard: "Débito",
  credit_card: "Crédito",
  debit_card: "Débito",
  pix: "PIX",
  "Cartão de Crédito": "Crédito",
  "Cartão de Débito": "Débito",
};
```

3. **Usar o mapa na coluna Método**:
```tsx
<TableCell>{paymentMethodLabels[r.payment_method ?? ""] ?? r.payment_method ?? "—"}</TableCell>
```

### Resultado

- Filtro de status funciona corretamente com os valores reais do banco
- Métodos de pagamento exibidos em português legível
- Status "Pendente" incluído no filtro

