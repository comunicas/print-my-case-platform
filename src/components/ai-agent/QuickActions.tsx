import { Button } from "@/components/ui/button";
import { TrendingUp, Package, AlertTriangle, BarChart3, Wallet, ArrowLeftRight } from "lucide-react";

const ACTIONS: Array<{ label: string; prompt: string; icon: React.ElementType }> = [
  { label: "Otimizar estoque entre PDVs", icon: ArrowLeftRight, prompt: "Sugira como redistribuir o estoque entre meus PDVs para evitar rupturas." },
  { label: "Resumo dos últimos 30 dias", icon: TrendingUp, prompt: "Me dê um resumo de vendas dos últimos 30 dias (faturamento, ticket médio, top 5 produtos)." },
  { label: "Produtos em ruptura", icon: AlertTriangle, prompt: "Quais produtos estão com baixo estoque e ainda têm demanda?" },
  { label: "Top produtos vendidos", icon: Package, prompt: "Quais foram os 10 produtos mais vendidos nos últimos 30 dias?" },
  { label: "Comparar PDVs", icon: BarChart3, prompt: "Compare o desempenho dos meus PDVs nos últimos 30 dias." },
  { label: "DRE do mês", icon: Wallet, prompt: "Mostre o resultado financeiro (DRE simplificado) do mês atual." },
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
