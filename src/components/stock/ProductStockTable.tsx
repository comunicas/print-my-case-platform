import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Eye, ShoppingCart } from 'lucide-react';
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
import { ProductStock } from '@/lib/stockUtils';
import { productActionLabels, productActionColors, salesIndexLabels, salesIndexColors } from '@/lib/stockLabels';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProductModal } from '@/contexts/ProductModalContext';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { DataPagination } from '@/components/ui/data-pagination';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';

interface ProductStockTableProps {
  products: ProductStock[];
  isLoading?: boolean;
}

type SortField = 'slot' | 'model' | 'quantity' | 'sales' | 'slots' | 'status';
type SortDirection = 'asc' | 'desc';

export function ProductStockTable({ products, isLoading }: ProductStockTableProps) {
  const [sortField, setSortField] = useState<SortField>('slot');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const pageSize = 10;
  const { openProductModal } = useProductModal();
  const { selectedPdv } = useStockFilters();
  const isMobile = useIsMobile();
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const isGlobalView = !selectedPdv || selectedPdv === 'all';

  const sortedProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'slot':
          comparison = (a.slots[0]?.slotNumber || '').localeCompare(b.slots[0]?.slotNumber || '', undefined, { numeric: true });
          break;
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
        case 'status': {
          const statusOrder: Record<string, number> = { restock: 0, warning: 1, monitor: 2, perfect: 3 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
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

  // Navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const maxIndex = paginatedProducts.length - 1;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => prev < maxIndex ? prev + 1 : prev);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex <= maxIndex) {
          const product = paginatedProducts[focusedIndex];
          openProductModal(product.productKey, selectedPdv !== 'all' ? selectedPdv : undefined);
        }
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(maxIndex);
        break;
    }
  }, [focusedIndex, paginatedProducts, openProductModal, selectedPdv]);

  // Mover foco para linha quando índice muda
  useEffect(() => {
    if (focusedIndex >= 0 && rowRefs.current[focusedIndex]) {
      rowRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Resetar foco quando muda de página
  useEffect(() => {
    setFocusedIndex(-1);
  }, [page]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  if (products.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Nenhum produto encontrado</div>;
  }

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {paginatedProducts.map((product) => (
            <Card
              key={product.productKey}
              className="overflow-hidden active:bg-muted/50 transition-colors"
              onClick={() => openProductModal(product.productKey, selectedPdv !== 'all' ? selectedPdv : undefined)}
            >
              <CardContent className="p-3">
                {/* Line 1: Slot + Product + Status */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {product.slots.map(s => s.slotNumber).join(',')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <ProductDisplay brand={product.brand} model={product.model} logoSize="sm" />
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 text-[10px] px-1.5", productActionColors[product.status])}>
                    {productActionLabels[product.status]}
                  </Badge>
                </div>
                {/* Line 2: Sales + Stock + Eye */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ShoppingCart className="h-3 w-3" />
                    <span className="font-medium text-foreground">{product.totalSold}</span>
                    <Badge variant="outline" className={cn("text-[9px] px-1 py-0", salesIndexColors[product.salesIndex])}>
                      {salesIndexLabels[product.salesIndex]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <Progress value={(product.totalQuantity / product.maxCapacity) * 100} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium shrink-0">{product.totalQuantity}/{product.maxCapacity}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); openProductModal(product.productKey, selectedPdv !== 'all' ? selectedPdv : undefined); }}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <DataPagination
            page={page + 1}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={products.length}
            hasNextPage={page < totalPages - 1}
            hasPrevPage={page > 0}
            onPageChange={(p) => setPage(p - 1)}
            showPageSizeSelector={false}
          />
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
           <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('slot')}>
                <div className="flex items-center gap-1">Slot <SortIcon field="slot" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('model')}>
                <div className="flex items-center gap-1">Produto <SortIcon field="model" /></div>
              </TableHead>
              {isGlobalView && (
                <TableHead>PDV</TableHead>
              )}
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('sales')}>
                <div className="flex items-center gap-1">Vendas <SortIcon field="sales" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('quantity')}>
                <div className="flex items-center gap-1">Estoque <SortIcon field="quantity" /></div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('slots')}>
                <div className="flex items-center gap-1">Slots <SortIcon field="slots" /></div>
              </TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody onKeyDown={handleKeyDown} role="grid">
            {paginatedProducts.map((product, index) => (
              <TableRow 
                key={product.productKey}
                ref={el => rowRefs.current[index] = el}
                tabIndex={focusedIndex === index ? 0 : -1}
                className={cn(focusedIndex === index && "ring-2 ring-primary ring-inset")}
                onFocus={() => setFocusedIndex(index)}
                data-testid="product-row"
                data-product-name={product.model}
              >
                <TableCell>
                  <span className="font-mono text-sm text-muted-foreground">
                    {product.slots.map(s => s.slotNumber).join(', ')}
                  </span>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => openProductModal(product.productKey, selectedPdv !== 'all' ? selectedPdv : undefined)}
                        className="text-left text-primary hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                        data-testid="product-name"
                      >
                        <ProductDisplay brand={product.brand} model={product.model} logoSize="sm" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent><p>Clique para ver detalhes</p></TooltipContent>
                  </Tooltip>
                </TableCell>
                {isGlobalView && (
                  <TableCell>
                    <span className="text-sm text-muted-foreground truncate max-w-[120px] block">
                      {product.pdvName || '—'}
                    </span>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className={productActionColors[product.status]}>
                    {productActionLabels[product.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{product.totalSold}</span>
                        </div>
                        <Badge variant="outline" className={salesIndexColors[product.salesIndex]} data-testid={`sales-badge-${product.salesIndex}`}>
                          {salesIndexLabels[product.salesIndex]}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{product.totalSold === 0 ? 'Nenhuma venda registrada' : `${product.totalSold} unidade${product.totalSold > 1 ? 's' : ''} vendida${product.totalSold > 1 ? 's' : ''}`}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={(product.totalQuantity / product.maxCapacity) * 100} className="h-2 w-16" />
                    <span className="text-sm font-medium">{product.totalQuantity}/{product.maxCapacity}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.slots.length}</span>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openProductModal(product.productKey, selectedPdv !== 'all' ? selectedPdv : undefined)} data-testid="product-detail-button">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Ver detalhes</p></TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <DataPagination
          page={page + 1}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={products.length}
          hasNextPage={page < totalPages - 1}
          hasPrevPage={page > 0}
          onPageChange={(p) => setPage(p - 1)}
          showPageSizeSelector={false}
        />
      )}
    </div>
    </TooltipProvider>
  );
}
