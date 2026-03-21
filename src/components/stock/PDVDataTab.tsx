import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataPagination } from '@/components/ui/data-pagination';
import { usePDVSalesData } from '@/hooks/usePDVSalesData';
import { formatCurrency } from '@/lib/utils';
import type { SlotData } from '@/lib/stockUtils';

interface PDVDataTabProps {
  slots: SlotData[];
}

const STATUS_VARIANTS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  Completed: { label: 'Pago', variant: 'default' },
  Pago: { label: 'Pago', variant: 'default' },
  'Concluído': { label: 'Concluído', variant: 'default' },
  Cancelado: { label: 'Cancelado', variant: 'destructive' },
  Cancelled: { label: 'Cancelado', variant: 'destructive' },
  Refunded: { label: 'Estornado', variant: 'secondary' },
};

const PAYMENT_LABELS: Record<string, string> = {
  creditCard: 'Cartão Crédito',
  debitCard: 'Cartão Débito',
  pix: 'PIX',
  cash: 'Dinheiro',
};

// Stock pagination (client-side)
const STOCK_PAGE_SIZE = 25;

export function PDVDataTab({ slots }: PDVDataTabProps) {
  const { sales, isLoading: salesLoading, pagination: salesPagination } = usePDVSalesData();
  const [stockPage, setStockPage] = useState(1);

  const stockTotalPages = Math.max(1, Math.ceil(slots.length / STOCK_PAGE_SIZE));
  const paginatedSlots = useMemo(() => {
    const from = (stockPage - 1) * STOCK_PAGE_SIZE;
    return slots.slice(from, from + STOCK_PAGE_SIZE);
  }, [slots, stockPage]);

  return (
    <div className="space-y-6">
      {/* Sales Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {salesLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => {
                      const statusInfo = STATUS_VARIANTS[sale.status || ''] || { label: sale.status || '—', variant: 'outline' as const };
                      return (
                        <TableRow key={sale.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {sale.payment_date
                              ? format(new Date(sale.payment_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : '—'}
                          </TableCell>
                          <TableCell className="text-sm font-medium max-w-[200px] truncate">
                            {sale.product_name}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(sale.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className="text-xs">
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {PAYMENT_LABELS[sale.payment_method || ''] || sale.payment_method || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <div className="p-4 border-t">
                <DataPagination
                  page={salesPagination.page}
                  totalPages={salesPagination.totalPages}
                  pageSize={salesPagination.pageSize}
                  totalCount={salesPagination.totalCount}
                  hasNextPage={salesPagination.hasNextPage}
                  hasPrevPage={salesPagination.hasPrevPage}
                  onPageChange={salesPagination.setPage}
                  onPageSizeChange={salesPagination.setPageSize}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estoque</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead>PDV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum registro de estoque
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSlots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell className="font-mono text-sm">{slot.slot}</TableCell>
                    <TableCell className="text-sm font-medium max-w-[200px] truncate">
                      {slot.productName}
                    </TableCell>
                    <TableCell className="text-center text-sm">{slot.quantity}</TableCell>
                    <TableCell className="text-center">
                      {slot.isActive ? (
                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-destructive mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{slot.pdvName}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t">
            <DataPagination
              page={stockPage}
              totalPages={stockTotalPages}
              pageSize={STOCK_PAGE_SIZE}
              totalCount={slots.length}
              hasNextPage={stockPage < stockTotalPages}
              hasPrevPage={stockPage > 1}
              onPageChange={setStockPage}
              showPageSizeSelector={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
