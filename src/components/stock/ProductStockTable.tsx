import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Eye, ShoppingCart, Plus, Pencil, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProductModal } from '@/contexts/ProductModalContext';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { useProfile } from '@/hooks/useProfile';
import { usePDVs } from '@/hooks/usePDVs';
import { useStockCRUD } from '@/hooks/useStockCRUD';
import { StockCRUDDialog, StockRecordFormData } from './StockCRUDDialog';
import { DataPagination } from '@/components/ui/data-pagination';
import { cn } from '@/lib/utils';

interface ProductStockTableProps {
  products: ProductStock[];
  isLoading?: boolean;
}

type SortField = 'model' | 'quantity' | 'sales' | 'slots' | 'status';
type SortDirection = 'asc' | 'desc';

export function ProductStockTable({ products, isLoading }: ProductStockTableProps) {
  const [sortField, setSortField] = useState<SortField>('quantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const pageSize = 10;
  const { openProductModal } = useProductModal();
  const { selectedPdv } = useStockFilters();
  const { isAdmin } = useProfile();
  const { pdvs } = usePDVs();
  const { createRecord, updateRecord, deleteRecord, isLoading: isCRUDLoading } = useStockCRUD();
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // CRUD dialog state
  const [crudDialogOpen, setCrudDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StockRecordFormData | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const selectedPdvData = useMemo(() => {
    if (!selectedPdv || selectedPdv === 'all') return null;
    return pdvs.find(p => p.id === selectedPdv) || null;
  }, [selectedPdv, pdvs]);

  const handleAddRecord = () => {
    setEditingRecord(null);
    setCrudDialogOpen(true);
  };

  const handleEditSlot = (product: ProductStock) => {
    // Edit the first slot of this product
    const firstSlot = product.slots[0];
    if (!firstSlot) return;
    setEditingRecord({
      id: firstSlot.id,
      slot_number: firstSlot.slotNumber,
      product_name: product.productName,
      quantity: firstSlot.quantity,
      is_active: true,
    });
    setCrudDialogOpen(true);
  };

  const handleCRUDSubmit = (data: StockRecordFormData) => {
    if (data.id) {
      updateRecord.mutate({
        id: data.id,
        product_name: data.product_name,
        quantity: data.quantity,
        is_active: data.is_active,
      }, {
        onSuccess: () => setCrudDialogOpen(false),
      });
    } else {
      if (!selectedPdvData) return;
      createRecord.mutate({
        pdv_id: selectedPdvData.id,
        device_id: selectedPdvData.machine_id,
        slot_number: data.slot_number,
        product_name: data.product_name,
        quantity: data.quantity,
        is_active: data.is_active,
      }, {
        onSuccess: () => setCrudDialogOpen(false),
      });
    }
  };

  const handleDeleteProduct = (product: ProductStock) => {
    const firstSlot = product.slots[0];
    if (!firstSlot) return;
    setDeleteTarget({ id: firstSlot.id, name: product.model });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteRecord.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

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

  useEffect(() => {
    if (focusedIndex >= 0 && rowRefs.current[focusedIndex]) {
      rowRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [page]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>;
  }

  if (products.length === 0) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Nenhum produto encontrado</div>;
  }

  const canAddRecord = isAdmin && selectedPdvData;

  return (
    <TooltipProvider>
    <div className="space-y-4">
      {/* Header com botão de adicionar */}
      {canAddRecord && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAddRecord}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Registro
          </Button>
        </div>
      )}

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
              <TableHead className="w-[100px]"></TableHead>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => openProductModal(product.productKey, selectedPdv !== 'all' ? selectedPdv : undefined)}
                        className="text-left text-primary hover:underline cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                        data-testid="product-name"
                      >
                        <ProductDisplay 
                          brand={product.brand} 
                          model={product.model}
                          logoSize="sm"
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clique para ver detalhes</p>
                    </TooltipContent>
                  </Tooltip>
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{product.totalSold}</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={salesIndexColors[product.salesIndex]}
                          data-testid={`sales-badge-${product.salesIndex}`}
                        >
                          {salesIndexLabels[product.salesIndex]}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {product.totalSold === 0 
                          ? 'Nenhuma venda registrada' 
                          : `${product.totalSold} unidade${product.totalSold > 1 ? 's' : ''} vendida${product.totalSold > 1 ? 's' : ''}`
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.slots.length}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={productActionColors[product.status]}>
                    {productActionLabels[product.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openProductModal(product.productKey, selectedPdv !== 'all' ? selectedPdv : undefined)}
                          data-testid="product-detail-button"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver detalhes</p>
                      </TooltipContent>
                    </Tooltip>
                    {isAdmin && selectedPdvData && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditSlot(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
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

      {/* CRUD Dialog */}
      <StockCRUDDialog
        open={crudDialogOpen}
        onOpenChange={setCrudDialogOpen}
        onSubmit={handleCRUDSubmit}
        initialData={editingRecord}
        isLoading={isCRUDLoading}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o registro de "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
