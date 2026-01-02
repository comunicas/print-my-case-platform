import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { extractBrandFromProductName, extractModelFromProductName } from "@/lib/productNormalization";
import { QrCode } from "lucide-react";
import type { PublicStockItem } from "@/hooks/usePublicStock";

interface PublicStockListProps {
  items: PublicStockItem[];
  searchTerm: string;
  selectedBrand: string | null;
  catalogCodeEnabled?: boolean;
  onProductClick?: (productName: string) => void;
}

const statusConfig = {
  available: {
    label: "Disponível",
    variant: "default" as const,
    className: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
  },
  low: {
    label: "Últimas unidades",
    variant: "secondary" as const,
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
  },
  unavailable: {
    label: "Indisponível",
    variant: "outline" as const,
    className: "bg-muted text-muted-foreground",
  },
};

export function PublicStockList({ 
  items, 
  searchTerm, 
  selectedBrand,
  catalogCodeEnabled = false,
  onProductClick,
}: PublicStockListProps) {
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = !selectedBrand || extractBrandFromProductName(item.product_name) === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  if (filteredItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {searchTerm
            ? "Nenhum modelo encontrado para sua busca."
            : "Nenhum produto disponível no momento."}
        </CardContent>
      </Card>
    );
  }

  const handleClick = (productName: string) => {
    if (catalogCodeEnabled && onProductClick) {
      onProductClick(productName);
    }
  };

  return (
    <div className="space-y-2">
      {filteredItems.map((item) => {
        const brand = extractBrandFromProductName(item.product_name);
        const model = extractModelFromProductName(item.product_name);
        const config = statusConfig[item.status];
        const isClickable = catalogCodeEnabled && onProductClick;

        return (
          <Card 
            key={item.product_name} 
            className={`transition-colors hover:bg-muted/50 ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={() => handleClick(item.product_name)}
          >
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <BrandLogo brand={brand} size="sm" />
                <span className="font-medium">{model}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={config.variant} className={config.className}>
                  {config.label}
                </Badge>
                {isClickable && (
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
