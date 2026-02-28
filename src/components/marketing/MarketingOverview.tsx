import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, Image, ArrowRight, UserPlus, BarChart3, MessageSquare } from "lucide-react";

interface MarketingOverviewProps {
  onNavigate: (tab: string) => void;
  isAdmin?: boolean;
}

export function MarketingOverview({ onNavigate, isAdmin }: MarketingOverviewProps) {
  const cards = [
    {
      id: "cupons",
      title: "Cupons",
      description: "Configure cupons e QR codes personalizados para cada ponto de venda.",
      icon: Ticket,
    },
    {
      id: "midias",
      title: "Mídias",
      description: "Gerencie fotos e vídeos promocionais para suas vitrines digitais.",
      icon: Image,
    },
    ...(isAdmin
      ? [
          {
            id: "pedidos",
            title: "Pedidos",
            description: "Gerencie pedidos de produtos recebidos pelo catálogo público.",
            icon: MessageSquare,
          },
          {
            id: "leads",
            title: "Leads",
            description: "Visualize os leads capturados pelo catálogo público.",
            icon: UserPlus,
          },
          {
            id: "analytics",
            title: "Analytics",
            description: "Acompanhe métricas de desempenho do seu marketing.",
            icon: BarChart3,
          },
        ]
      : []),
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => onNavigate(card.id)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {card.description}
              </CardDescription>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent"
              >
                Acessar
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
