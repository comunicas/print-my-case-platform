import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, Search, Package, ShoppingCart, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { uploadTypeLabels, uploadStatusLabels } from "@/lib/schemas/upload";
import { useUploadDetails, SalesRecordPreview, StockRecordPreview } from "@/hooks/useUploadDetails";
import { formatCurrency } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

const UploadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    upload,
    isLoading,
    salesRecords,
    salesRecordsLoading,
    stockRecords,
    stockRecordsLoading,
  } = useUploadDetails(id);

  const filteredSalesRecords = useMemo(() => {
    if (!searchQuery) return salesRecords;
    return salesRecords.filter((r) =>
      r.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [salesRecords, searchQuery]);

  const filteredStockRecords = useMemo(() => {
    if (!searchQuery) return stockRecords;
    return stockRecords.filter((r) =>
      r.product_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stockRecords, searchQuery]);

  const totalRecords =
    upload?.type === "sales"
      ? filteredSalesRecords.length
      : filteredStockRecords.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const paginatedSalesRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSalesRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSalesRecords, currentPage]);

  const paginatedStockRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStockRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStockRecords, currentPage]);

  // Estatísticas
  const salesStats = useMemo(() => {
    const total = salesRecords.reduce((acc, r) => acc + Number(r.amount), 0);
    const refunds = salesRecords.filter((r) => (r.refund_amount || 0) > 0).length;
    return { total, refunds };
  }, [salesRecords]);

  const stockStats = useMemo(() => {
    const totalUnits = stockRecords.reduce((acc, r) => acc + r.quantity, 0);
    const activeSlots = stockRecords.filter((r) => r.is_active).length;
    return { totalUnits, activeSlots };
  }, [stockRecords]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!upload) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Upload não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/uploads")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Uploads
          </Button>
        </div>
      </AppLayout>
    );
  }

  const statusColors: Record<string, string> = {
    processing: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    ready: "bg-green-500/10 text-green-600 border-green-500/20",
    error: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const recordsLoading = upload.type === "sales" ? salesRecordsLoading : stockRecordsLoading;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/uploads")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Upload</h1>
        </div>

        {/* Card com informações do upload */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {upload.type === "sales" ? (
                  <ShoppingCart className="h-6 w-6 text-primary" />
                ) : (
                  <Package className="h-6 w-6 text-primary" />
                )}
                <div>
                  <CardTitle className="text-xl">
                    {uploadTypeLabels[upload.type]}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {upload.pdv.name} • Código: {upload.pdv.machine_id}
                  </p>
                </div>
              </div>
              <Badge className={statusColors[upload.status]}>
                {uploadStatusLabels[upload.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Período</p>
                <p className="font-medium">
                  {upload.period ? format(new Date(upload.period + "-01"), "MMM yyyy", { locale: ptBR }) : "-"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Arquivo</p>
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium truncate">{upload.file_name}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Enviado por</p>
                <p className="font-medium">{upload.uploader.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data de envio</p>
                <p className="font-medium">
                  {format(new Date(upload.uploaded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Resumo estatístico */}
            <div className="mt-4 pt-4 border-t">
              {upload.type === "sales" ? (
                <p className="text-sm">
                  <span className="font-medium">{salesRecords.length}</span>{" "}
                  transações •{" "}
                  <span className="font-medium text-primary">
                    {formatCurrency(salesStats.total)}
                  </span>{" "}
                  total •{" "}
                  <span className="font-medium">{salesStats.refunds}</span>{" "}
                  reembolsos
                </p>
              ) : (
                <p className="text-sm">
                  <span className="font-medium">{stockRecords.length}</span>{" "}
                  slots •{" "}
                  <span className="font-medium text-primary">
                    {stockStats.totalUnits}
                  </span>{" "}
                  unidades total •{" "}
                  <span className="font-medium">{stockStats.activeSlots}</span>{" "}
                  slots ativos
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de dados */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Dados da Planilha</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : upload.type === "sales" ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Reembolso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSalesRecords.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSalesRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {record.product_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(record.amount))}
                          </TableCell>
                          <TableCell>{record.payment_method || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                record.status === "Pago"
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                              }
                            >
                              {record.status || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(record.payment_date), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">
                            {(record.refund_amount || 0) > 0
                              ? formatCurrency(Number(record.refund_amount))
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slot</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStockRecords.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStockRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.slot_number}
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate">
                            {record.product_name}
                          </TableCell>
                          <TableCell className="text-right">
                            {record.quantity}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                record.is_active
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {record.is_active ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} de{" "}
                  {totalRecords} registros
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UploadDetails;
