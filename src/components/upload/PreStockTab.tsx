import { useState } from "react";
import { usePreStock } from "@/hooks/usePreStock";
import { usePDVs } from "@/hooks/usePDVs";
import { useProfile } from "@/hooks/useProfile";
import { PreStockForm } from "./PreStockForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchFilter } from "@/components/ui/SearchFilter";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { PDVFilter } from "@/components/ui/PDVFilter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Trash2, Package, Loader2, ShoppingCart, DollarSign, CheckCircle, TableIcon, BarChart3 } from "lucide-react";
import { PreStockRanking } from "./PreStockRanking";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function PreStockTab() {
  const { pdvs } = usePDVs();
  const { isAdmin } = useProfile();

  const [filterPdv, setFilterPdv] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { items, isLoading, createItem, deleteItem, productNames, summary } = usePreStock({
    pdvId: filterPdv,
    status: filterStatus,
    search,
  });

  const handleDelete = () => {
    if (!deletingId) return;
    deleteItem.mutate(deletingId, {
      onSuccess: () => setDeletingId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }



  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
              <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-xl font-bold text-foreground">{summary.pendingUnits} un.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Pendente</p>
              <p className="text-xl font-bold text-foreground">
                {summary.pendingValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-2">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alocados</p>
              <p className="text-xl font-bold text-foreground">{summary.allocatedUnits} un.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action button */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Compra
          </Button>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        hasActiveFilters={search !== "" || filterPdv !== "all" || filterStatus !== "all"}
        onClear={() => {
          setSearch("");
          setFilterPdv("all");
          setFilterStatus("all");
        }}
      >
        <SearchFilter
          value={search}
          onChange={setSearch}
          placeholder="Buscar produto..."
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
            { value: "all", label: "Todos" },
            { value: "pending", label: "Pendente" },
            { value: "allocated", label: "Alocado" },
          ]}
        />
      </FilterBar>

      {/* Table */}
      {items.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>PDV</TableHead>
                <TableHead className="text-center">Comprado</TableHead>
                <TableHead className="text-center">Restante</TableHead>
                <TableHead className="text-right">Custo Un.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                {isAdmin && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.status === "allocated" && item.allocated_pdv?.name
                      ? `→ ${item.allocated_pdv.name}`
                      : item.pdv?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center font-semibold">
                    {item.remaining_quantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    R$ {(item.unit_cost ?? 15).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "pending"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      }
                    >
                      {item.status === "pending" ? "Pendente" : "Alocado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingId(item.id)}
                        disabled={deleteItem.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            Nenhuma compra registrada
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search || filterPdv !== "all" || filterStatus !== "all"
              ? "Tente ajustar seus filtros."
              : "Registre sua primeira compra de pré-estoque."}
          </p>
        </div>
      )}

      {/* Form Dialog */}
      <PreStockForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        pdvs={pdvs.filter((p) => p.status === "active")}
        productNames={productNames}
        onSubmit={(data) => {
          createItem.mutate(data, {
            onSuccess: () => setIsFormOpen(false),
          });
        }}
        isSubmitting={createItem.isPending}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este registro de compra?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
