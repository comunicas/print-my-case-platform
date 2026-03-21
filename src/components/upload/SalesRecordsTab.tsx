import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { DataPagination } from "@/components/ui/data-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useSalesRecords, type SalesRecordItem, type CreateSalesRecordData } from "@/hooks/useSalesRecords";
import { SalesRecordFormDialog } from "./SalesRecordFormDialog";

interface Props {
  pdvs: { id: string; name: string; machine_id: string; status: string | null }[];
}

const statusLabels: Record<string, string> = {
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  concluído: "Concluído",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const statusColors: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  concluído: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  cancelado: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  reembolsado: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function SalesRecordsTab({ pdvs }: Props) {
  const { isAdmin } = useProfile();
  const [search, setSearch] = useState("");
  const [filterPdv, setFilterPdv] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecordItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    records,
    isLoading,
    totalCount,
    pagination,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useSalesRecords({ pdvId: filterPdv, status: filterStatus, search });

  const activePdvs = pdvs.filter((p) => p.status === "active");

  const handleFormSubmit = (data: CreateSalesRecordData) => {
    if (editingRecord) {
      updateRecord.mutate(
        { ...data, id: editingRecord.id },
        { onSuccess: () => { setFormOpen(false); setEditingRecord(null); } }
      );
    } else {
      createRecord.mutate(data, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleEdit = (record: SalesRecordItem) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    deleteRecord.mutate(deletingId, {
      onSuccess: () => { setDeleteDialogOpen(false); setDeletingId(null); },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters + Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          hasActiveFilters={search !== "" || filterPdv !== "all" || filterStatus !== "all"}
          onClear={() => { setSearch(""); setFilterPdv("all"); setFilterStatus("all"); }}
          className="flex-1"
        >
          <SearchFilter
            value={search}
            onChange={setSearch}
            placeholder="Buscar pedido ou produto..."
            className="flex-1"
          />
          <PDVFilter
            value={filterPdv}
            onChange={setFilterPdv}
            pdvs={pdvs}
            triggerClassName="w-[160px]"
          />
          <SelectFilter
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Status"
            triggerClassName="w-[140px]"
            options={[
              { value: "all", label: "Todos os status" },
              { value: "Completed", label: "Concluído" },
              { value: "Cancelled", label: "Cancelado" },
              { value: "Refunded", label: "Reembolsado" },
            ]}
          />
        </FilterBar>

        {isAdmin && (
          <Button className="w-full sm:w-auto" onClick={() => { setEditingRecord(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Reembolso</TableHead>
              <TableHead>PDV</TableHead>
              {isAdmin && <TableHead className="w-[80px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            )}
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.order_number}</TableCell>
                <TableCell className="max-w-[200px] truncate">{r.product_name}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(r.amount)}</TableCell>
                <TableCell className="text-sm">
                  {r.payment_date
                    ? format(new Date(r.payment_date), "dd/MM/yy HH:mm", { locale: ptBR })
                    : "—"}
                </TableCell>
                <TableCell className="text-sm">{r.payment_method ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={statusColors[r.status ?? ""] ?? "bg-muted text-muted-foreground"}>
                    {statusLabels[r.status ?? ""] ?? r.status ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm">
                  {r.refund_amount && r.refund_amount > 0
                    ? formatCurrency(r.refund_amount)
                    : "—"}
                </TableCell>
                <TableCell className="text-sm">{r.pdv.name}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { setDeletingId(r.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > pagination.pageSize && (
        <DataPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalCount={totalCount}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={[25, 50, 100]}
        />
      )}

      {/* Form Dialog */}
      <SalesRecordFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingRecord(null); }}
        pdvOptions={activePdvs.map((p) => ({ id: p.id, name: p.name, machine_id: p.machine_id }))}
        editingRecord={editingRecord}
        onSubmit={handleFormSubmit}
        isSubmitting={createRecord.isPending || updateRecord.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de venda? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteRecord.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteRecord.isPending}
            >
              {deleteRecord.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
