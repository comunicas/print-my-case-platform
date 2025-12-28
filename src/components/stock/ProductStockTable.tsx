import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProductDisplay } from '@/components/ui/ProductDisplay';
import { ProductStock, SalesIndex, ProductStatus } from '@/lib/stockUtils';
import { MAX_CAPACITY } from '@/lib/stockGridUtils';

interface ProductStockTableProps {
  products: ProductStock[];
  isLoading?: boolean;
}

type SortField = 'model' | 'quantity' | 'sales' | 'slots' | 'status';
type SortDirection = 'asc' | 'desc';

const salesIndexLabels: Record<SalesIndex, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
  none: 'Nenhuma',
};

const salesIndexColors: Record<SalesIndex, string> = {
  high: 'bg-green-500/10 text-green-600 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  low: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  none: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<ProductStatus, string> = {
  ok: 'Ok',
  redistribute: 'Redistribuir',
  restock: 'Repor!',
};

const statusColors: Record<ProductStatus, string> = {
  ok: 'bg-green-500/10 text-green-600 border-green-500/20',
  redistribute: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  restock: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function ProductStockTable({ products, isLoading }: ProductStockTableProps) {
  const [sortField, setSortField] = useState<SortField>('quantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const sortedProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'model':
          comparison = a.model.localeCompare(b.model);
          break;
        case 'quantity':
          comparison = a.totalQuantity - b.totalQuantity;
          break;
        case 'sales':
          comparison = a.totalSold - b.totalSold;
          break;
        case 'slots':
          comparison = a.slots.length - b.slots.length;
          break;
        case 'status':
          const statusOrder = { restock: 0, redistribute: 1, ok: 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [products, sortField, sortDirection]);

  const paginatedProducts = useMemo(() => {
    const start = page * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, page]);

  const totalPages = Math.ceil(products.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  if (products.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Nenhum produto encontrado</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('model')}
              >
                <div className="flex items-center gap-1">
                  Produto <SortIcon field="model" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center gap-1">
                  Estoque <SortIcon field="quantity" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('sales')}
              >
                <div className="flex items-center gap-1">
                  Vendas <SortIcon field="sales" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('slots')}
              >
                <div className="flex items-center gap-1">
                  Slots <SortIcon field="slots" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.map((product) => (
              <>
                <TableRow key={product.productKey}>
                  <TableCell>
                    <ProductDisplay 
                      brand={product.brand} 
                      model={product.model}
                      logoSize="sm"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress 
                        value={(product.totalQuantity / product.maxCapacity) * 100} 
                        className="h-2 w-16"
                      />
                      <span className="text-sm font-medium">
                        {product.totalQuantity}/{product.maxCapacity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={salesIndexColors[product.salesIndex]}>
                      {salesIndexLabels[product.salesIndex]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{product.slots.length}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[product.status]}>
                      {statusLabels[product.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setExpandedProduct(
                        expandedProduct === product.productKey ? null : product.productKey
                      )}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedProduct === product.productKey && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/30">
                      <div className="p-4">
                        <p className="text-sm font-medium mb-2">Detalhes dos Slots:</p>
                        <div className="flex flex-wrap gap-2">
                          {product.slots.map((slot) => (
                            <div 
                              key={slot.slotNumber}
                              className="px-3 py-1 rounded-md bg-background border text-sm"
                            >
                              Slot {slot.slotNumber}: {slot.quantity}/{MAX_CAPACITY}
                            </div>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {page * pageSize + 1}-{Math.min((page + 1) * pageSize, products.length)} de {products.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
