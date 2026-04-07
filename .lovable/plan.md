

## Análise: Reorganizar Compras → Estoque e Vendas → Financeiro

### Complexidade: **Baixa-Média** (~2-3 horas)

Os componentes `PreStockTab` e `SalesRecordsTab` já são módulos independentes com seus próprios hooks. A mudança é essencialmente de **roteamento e layout**, não de lógica.

### Por que faz sentido

- **Uploads** fica focado na sua função: receber e processar planilhas
- **Estoque** ganha a aba "Compras" — faz sentido conceitual (pré-estoque é estoque pendente)
- **Financeiro** ganha a aba "Vendas" — faz sentido (vendas são dados financeiros/receita)
- A sidebar já tem submenus para Estoque e Marketing; basta adicionar as novas sub-rotas

### O que muda

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Uploads.tsx` | Remover tabs "Vendas" e "Compras", manter apenas a lista de uploads |
| `src/pages/Stock.tsx` | Adicionar tab "Compras" (importar `PreStockTab`) — tabs: Tabela, Mapa, Compras |
| `src/pages/Financeiro.tsx` | Adicionar tab "Vendas" (importar `SalesRecordsTab`) — tabs: Resumo, DRE, Despesas, Vendas |
| `src/components/layout/AppSidebar.tsx` | Adicionar sub-item "Compras" em Estoque (`/estoque?tab=compras`) |
| `src/components/layout/MobileSidebar.tsx` | Mesmo: sub-item "Compras" em Estoque |
| Sidebar Estoque/Financeiro | Atualizar `stockSubItems` e rotas do Financeiro na sidebar |

### O que NÃO muda

- Hooks (`usePreStock`, `useSalesRecords`) — zero alteração
- Componentes (`PreStockTab`, `SalesRecordsTab`) — zero alteração, só movem de página
- Edge functions — intocadas
- Banco de dados — intocado

### Riscos

- Nenhum risco técnico significativo. Os componentes são autocontidos.
- Único cuidado: atualizar `VALID_TABS` em `Stock.tsx` para incluir "compras"

### Recomendação

**Sim, fica mais organizado.** A separação de responsabilidades melhora a navegabilidade. Uploads vira apenas "gestão de planilhas", Estoque agrupa tudo sobre produtos físicos, e Financeiro concentra receita e despesas.

