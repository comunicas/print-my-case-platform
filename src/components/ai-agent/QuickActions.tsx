import { Button } from "@/components/ui/button";
import { TrendingUp, Package, AlertTriangle, BarChart3, Wallet, ArrowLeftRight } from "lucide-react";

const ACTIONS: Array<{ label: string; prompt: string; icon: React.ElementType }> = [
  {
    label: "Otimizar estoque entre PDVs",
    icon: ArrowLeftRight,
    prompt: `Faça a otimização de estoque entre PDVs seguindo exatamente esta sequência:
1. Chame get_pre_stock_detail com status='available' para ver o que está disponível na SEDE/pré-estoque.
2. Chame get_zero_stock_items para listar todos os produtos com 0 ou 1 unidade em cada PDV.
3. Chame get_stock_overview para confirmar disponibilidade em cada PDV da rede.
4. Apresente o resultado DIVIDIDO POR PDV, um bloco por PDV. Para cada PDV, use a tabela:
   | Slot | Produto | Qtd atual | Disponível em |
   Na coluna "Disponível em": liste SEDE primeiro (se tiver pré-estoque disponível, marque com ✅),
   depois os PDVs com estoque. Exemplo: "✅ SEDE (5 un), Tietê Plaza (2 un)"
   Se não houver fonte alguma, escreva "—".
   Se um PDV não tiver produtos críticos, escreva "Nenhum produto crítico neste PDV."`,
  },
  {
    label: "Resumo dos últimos 30 dias",
    icon: TrendingUp,
    prompt: `Faça um resumo completo de vendas dos últimos 30 dias seguindo esta sequência:
1. Chame get_sales_summary para obter o consolidado geral.
2. Chame get_pdv_comparison para obter o faturamento por PDV.
3. Chame get_top_products com limit=10 para os top produtos.
Apresente 3 seções separadas:
Seção 1 — Consolidado geral (tabela Métrica | Valor)
Seção 2 — Faturamento por PDV (tabela PDV | Faturamento | Transações | Ticket médio)
Seção 3 — Top 10 produtos (tabela # | Produto | Vendas (un) | Valor)`,
  },
  {
    label: "Produtos em ruptura",
    icon: AlertTriangle,
    prompt: `Identifique os produtos em ruptura e em risco em cada PDV seguindo esta sequência:
1. Chame get_zero_stock_items para listar os produtos com 0 unidades (ruptura real).
2. Chame get_low_stock_alerts com threshold=3 para capturar produtos com 1-3 unidades (risco iminente).
Apresente 2 seções separadas:
Seção "### Zerados agora" — dividida por PDV (#### [Nome do PDV]), tabela:
  | Slot | Produto | Qtd | Disponível em |
Seção "### Em risco (≤3 unidades)" — dividida por PDV, tabela:
  | Slot | Produto | Qtd atual | Status |
  Status: 🟠 Crítico (1-2 un), 🟡 Baixo (3 un)
Se um PDV não tiver ocorrências em determinada seção, escreva "Nenhum produto nesta categoria."`,
  },
  {
    label: "Top produtos vendidos",
    icon: Package,
    prompt: `Liste os 15 top produtos mais vendidos nos últimos 30 dias seguindo esta sequência:
1. Chame get_top_products com limit=15.
2. Chame get_sales_summary para obter o total de faturamento (para calcular % do total).
Apresente uma única tabela:
| # | Produto | Vendas (un) | % do total | Receita |
A coluna "Receita" deve mostrar a receita INDIVIDUAL de cada produto (campo revenue da tool),
NÃO uma soma acumulada ou running total. Cada linha mostra quanto aquele produto sozinho gerou.
Ao final, adicione uma linha de totais: total de unidades dos top 15 e soma das receitas individuais.`,
  },
  {
    label: "Comparar PDVs",
    icon: BarChart3,
    prompt: `Compare todos os PDVs seguindo esta sequência:
1. Chame get_pdv_comparison para obter faturamento e métricas de venda por PDV.
2. Chame get_stock_overview para obter o estoque atual de cada PDV.
Apresente 2 seções separadas:
Seção 1 — Desempenho de vendas (tabela PDV | Faturamento | Transações | Ticket médio | % do total)
Seção 2 — Estoque atual (tabela PDV | Total itens | Itens zerados | Itens críticos)
Ao final, destaque o PDV com melhor faturamento e o PDV com maior risco de ruptura.`,
  },
  {
    label: "DRE do mês",
    icon: Wallet,
    prompt: `Apresente o DRE completo do mês corrente seguindo esta sequência:
1. Chame get_financial_summary para obter os dados financeiros consolidados.
2. Apresente uma tabela no formato DRE:
   | Item | Valor |
   com as linhas: Faturamento bruto, Deduções (devoluções/descontos), Receita líquida,
   Despesas operacionais, CMV (custo mercadoria), Resultado operacional.
   Use negrito para Receita líquida e Resultado operacional.
   Se disponível, adicione uma segunda tabela com o DRE por PDV:
   | PDV | Faturamento | Despesas | Resultado |`,
  },
];

interface Props {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Button
            key={a.label}
            variant="outline"
            className="justify-start h-auto min-h-[44px] py-2.5 px-3 text-left whitespace-normal"
            onClick={() => onSelect(a.prompt)}
            disabled={disabled}
          >
            <Icon className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
            <span className="text-sm leading-snug break-words">{a.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
