

# Modulo Financeiro - DRE Simplificado

## Revisao das Implementacoes Recentes

As ultimas implementacoes de isolamento multi-org estao corretas e completas:
- **`usePDVs.ts`**: Filtro por `activeOrgId` funcionando com fallback para `profile.organization_id`
- **`useProductAnalytics.ts`**: Filtro por PDVs da org ativa implementado
- **`Uploads.tsx`**: Flash do botao corrigido com `!!role && role !== "viewer"`
- **RLS**: Policy de INSERT em `uploads` bloqueando viewers, DELETE ja restrito a admins
- **Trigger `validate_user_pdv_same_org`**: Previne atribuicoes cross-org futuras
- **`user_can_access_pdv`**: Validacao de org adicionada na branch de `user_pdvs`

Nenhuma correcao pendente.

---

## Plano: Modulo Financeiro (DRE Simplificado)

### Conceito

Criar um modulo onde o usuario insere manualmente suas despesas mensais e o sistema calcula automaticamente a DRE a partir dos dados de vendas ja existentes na plataforma.

Estrutura da DRE:
```text
(+) Faturamento Bruto ........... automatico (sum sales_records.amount)
(-) Deducoes da Venda ........... automatico (reembolsos + cancelamentos)
(=) Receita Liquida ............. calculado
(-) Despesas de Implantacao ..... input manual do usuario
(-) Despesas Fixas .............. input manual do usuario
(=) Resultado Operacional ...... calculado
```

### Fase 1: Tabela no banco de dados

Criar tabela `financial_entries` para armazenar as despesas inseridas manualmente:

```sql
CREATE TABLE public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pdv_id UUID REFERENCES pdvs(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('implantacao', 'fixas')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  reference_month DATE NOT NULL, -- primeiro dia do mes de referencia
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
```

**RLS Policies** (RESTRICTIVE, seguindo padrao do projeto):
- SELECT: admins da org + super_admin
- INSERT: admins da org (viewers e operators bloqueados)
- UPDATE: admins da org
- DELETE: admins da org

**Trigger**: `update_updated_at_column` (ja existe no projeto)

### Fase 2: Frontend - Pagina e Navegacao

**Nova rota**: `/financeiro`
**Novo arquivo**: `src/pages/Financeiro.tsx`

**Sidebar**: Adicionar item "Financeiro" com icone `Wallet` entre "Uploads" e "Marketing" em `AppSidebar.tsx` e `MobileSidebar.tsx`. Sem sub-menus inicialmente.

### Fase 3: Componentes

Criar em `src/components/financeiro/`:

1. **`DRETable.tsx`** - Tabela principal da DRE com:
   - Faturamento Bruto (automatico, vindo do `useDashboard` ou query dedicada)
   - Deducoes (reembolsos + cancelamentos, automaticos)
   - Receita Liquida (calculada)
   - Despesas de Implantacao (somatorio das entries do mes)
   - Despesas Fixas (somatorio das entries do mes)
   - Resultado Operacional (calculado)
   - Indicador visual: verde se positivo, vermelho se negativo

2. **`FinancialEntryForm.tsx`** - Dialog/formulario para inserir despesas:
   - Categoria (Implantacao ou Fixas) via Select
   - Descricao (texto livre, max 200 chars)
   - Valor (input numerico com mascara R$)
   - Mes de referencia (month picker)
   - PDV opcional (select)

3. **`FinancialEntriesList.tsx`** - Lista de despesas inseridas com:
   - Filtro por mes e categoria
   - Edicao inline ou via dialog
   - Exclusao com confirmacao

### Fase 4: Hook de dados

**`src/hooks/useFinancialEntries.ts`**:
- CRUD de `financial_entries` com react-query
- Filtro por mes de referencia e org ativa
- Calculo dos totais por categoria

**`src/hooks/useDRE.ts`**:
- Combina dados de vendas (query em `sales_records`) + despesas (`financial_entries`)
- Retorna estrutura DRE completa para o mes selecionado
- Filtro por PDV opcional

### Fase 5: Permissoes

- **org_admin / super_admin**: acesso total (CRUD de despesas + visualizacao DRE)
- **operator**: somente visualizacao da DRE (sem inserir/editar despesas)
- **viewer**: somente visualizacao da DRE

---

## Arquivos a criar/alterar

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar tabela `financial_entries` + RLS |
| `src/pages/Financeiro.tsx` | Nova pagina |
| `src/App.tsx` | Adicionar rota `/financeiro` |
| `src/components/layout/AppSidebar.tsx` | Adicionar item Financeiro |
| `src/components/layout/MobileSidebar.tsx` | Adicionar item Financeiro |
| `src/components/financeiro/DRETable.tsx` | Tabela DRE |
| `src/components/financeiro/FinancialEntryForm.tsx` | Formulario de despesas |
| `src/components/financeiro/FinancialEntriesList.tsx` | Lista de despesas |
| `src/components/financeiro/index.ts` | Barrel exports |
| `src/hooks/useFinancialEntries.ts` | CRUD hook |
| `src/hooks/useDRE.ts` | Hook de calculo DRE |

---

## Observacoes tecnicas

- O Faturamento Bruto e as Deducoes sao calculados automaticamente a partir da `sales_records`, sem duplicacao de dados
- O mes de referencia usa o primeiro dia do mes (`2026-02-01`) para facilitar queries com `=` em vez de ranges
- A tabela suporta PDV opcional para analise granular (DRE por PDV ou consolidado)
- O formulario usa zod para validacao client-side, seguindo o padrao do projeto (`src/lib/schemas/`)

