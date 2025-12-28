import { useState } from "react";
import { CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { LowStockItem } from "@/lib/dashboardUtils";

interface StockAlertsTableProps {
  data: LowStockItem[];
  maxCapacity?: number;
}

const ITEMS_PER_PAGE = 5;

const salesIndexLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  high: { label: "Alta", variant: "default" },
  medium: { label: "Média", variant: "secondary" },
  low: { label: "Baixa", variant: "outline" },
  none: { label: "Nenhuma", variant: "destructive" },
};

export function StockAlertsTable({ data, maxCapacity = 7 }: StockAlertsTableProps) {
  const [page, setPage] = useState(0);
  
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const paginatedData = data.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  
  const handlePrevPage = () => setPage(p => Math.max(0, p - 1));
  const handleNextPage = () => setPage(p => Math.min(totalPages - 1, p + 1));

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Estoque OK</h3>
          <p className="text-muted-foreground text-center">
            Nenhum produto com estoque crítico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas de Estoque ({data.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-4 md:px-6 pb-4 md:pb-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Slot</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Marca</TableHead>
                <TableHead className="hidden md:table-cell text-right">Vendas</TableHead>
                <TableHead className="hidden md:table-cell">Índice</TableHead>
                <TableHead className="w-[120px]">Qtd</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, idx) => (
                <TableRow key={`${item.slotNumber}-${idx}`}>
                  <TableCell className="font-medium">
                    <span className="font-mono">{item.slotNumber}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={item.productName}>
                    {item.productName}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {item.brand}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right">
                    {item.salesCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={salesIndexLabels[item.salesIndex].variant} className="text-xs">
                      {salesIndexLabels[item.salesIndex].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(item.quantity / maxCapacity) * 100} 
                        className={cn(
                          "h-2 w-16",
                          item.quantity === 0 && "[&>div]:bg-destructive",
                          item.quantity > 0 && item.quantity <= 2 && "[&>div]:bg-orange-500"
                        )}
                      />
                      <span className="text-sm font-mono w-8">
                        {item.quantity}/{maxCapacity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.quantity === 0 ? "destructive" : "outline"}
                      className={cn(
                        "text-xs",
                        item.quantity > 0 && "border-orange-500 text-orange-500"
                      )}
                    >
                      {item.quantity === 0 ? "Ruptura" : "Atenção"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages - 1}
                className="gap-1"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
