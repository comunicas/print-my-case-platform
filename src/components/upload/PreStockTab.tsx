import { useState } from "react";
import { usePreStock, PreStockItem } from "@/hooks/usePreStock";
import { usePDVs } from "@/hooks/usePDVs";
import { useProfile } from "@/hooks/useProfile";
import { PreStockForm } from "./PreStockForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/FilterBar";
import { ProductSearchAutocomplete, ProductSuggestion } from "@/components/stock/ProductSearchAutocomplete";
import { SelectFilter } from "@/components/ui/SelectFilter";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Package, Loader2, ShoppingCart, DollarSign, CheckCircle, TableIcon, BarChart3, ArrowRight, Undo2 } from "lucide-react";
import { PreStockRanking } from "./PreStockRanking";
import { PendingAllocations } from "./PendingAllocations";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { UseMutationResult } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { extractBrandFromProductName, extractModelFromProductName } from "@/lib/productNormalization";

interface PreStockListProps {
  items: PreStockItem[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onAllocate: (item: PreStockItem) => void;
  onUnallocate: (item: PreStockItem) => void;
  deleteItem: UseMutationResult<void, Error, string>;
}

function MobileAwarePreStockList({ items, isAdmin, onDelete, onAllocate, deleteItem }: PreStockListProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-semibold text-sm text-foreground truncate">{item.product_name}</span>
                <Badge
                  className={
                    item.status === "pending"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]"
                  }
                >
                  {item.status === "pending" ? "Pendente" : "Alocado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {item.remaining_quantity} restante / {item.quantity} comprado
                </span>
                <span>R$ {(item.unit_cost ?? 15).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                </span>
                <div className="flex gap-1">
                  {isAdmin && item.status === "pending" && item.remaining_quantity > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onAllocate(item)}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Alocar
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(item.id)}
                      disabled={deleteItem.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
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
            {isAdmin && <TableHead className="w-24" />}
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
              <TableCell className="text-center font-semibold">{item.remaining_quantity}</TableCell>
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
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <div className="flex gap-1">
                    {item.status === "pending" && item.remaining_quantity > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onAllocate(item)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Alocar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(item.id)}
                      disabled={deleteItem.isPending}
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
  );
}

export function PreStockTab() {
  const { pdvs } = usePDVs();
  const { isAdmin } = useProfile();

  const [filterPdv, setFilterPdv] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "ranking">("table");

  // Allocation modal state
  const [allocatingItem, setAllocatingItem] = useState<PreStockItem | null>(null);
  const [allocPdvId, setAllocPdvId] = useState("");
  const [allocQty, setAllocQty] = useState("");

  const { items, isLoading, createItem, deleteItem, allocateItem, productNames, summary } = usePreStock({
    pdvId: filterPdv,
    status: filterStatus,
    search,
  });

  // Fetch ALL items (no search filter) for stable suggestions
  const { items: allItems } = usePreStock({
    pdvId: filterPdv,
    status: filterStatus,
  });

  const handleSearchChange = useCallback((val: string) => {
    setSearch(val);
  }, []);

  const preStockSuggestions = useMemo<ProductSuggestion[]>(() => {
    const grouped = new Map<string, { brand: string; model: string; total: number }>();
    for (const item of allItems) {
      const name = item.product_name;
      const existing = grouped.get(name);
      if (existing) {
        existing.total += item.remaining_quantity;
      } else {
        const brand = extractBrandFromProductName(name);
        const model = extractModelFromProductName(name);
        grouped.set(name, { brand, model, total: item.remaining_quantity });
      }
    }
    return Array.from(grouped.entries()).map(([key, v]) => ({
      productKey: key,
      brand: v.brand,
      model: v.model,
      totalSold: v.total,
    }));
  }, [allItems]);

  const handleDelete = () => {
    if (!deletingId) return;
    deleteItem.mutate(deletingId, {
      onSuccess: () => setDeletingId(null),
    });
  };

  const openAllocateModal = (item: PreStockItem) => {
    setAllocatingItem(item);
    setAllocPdvId("");
    setAllocQty(String(item.remaining_quantity));
  };

  const handleAllocate = () => {
    if (!allocatingItem || !allocPdvId) return;
    const qty = parseInt(allocQty, 10);
    if (isNaN(qty) || qty <= 0 || qty > allocatingItem.remaining_quantity) return;

    allocateItem.mutate(
      {
        id: allocatingItem.id,
        pdv_id: allocPdvId,
        quantity: qty,
        currentRemaining: allocatingItem.remaining_quantity,
      },
      {
        onSuccess: () => setAllocatingItem(null),
      }
    );
  };

  const activePdvs = pdvs.filter((p) => p.status === "active");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Allocations Banner */}
      <PendingAllocations />

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            className="rounded-none h-9 sm:h-8 flex-1 sm:flex-none px-3"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4 mr-1.5" />
            Tabela
          </Button>
          <Button
            variant={viewMode === "ranking" ? "default" : "ghost"}
            size="sm"
            className="rounded-none h-9 sm:h-8 flex-1 sm:flex-none px-3"
            onClick={() => setViewMode("ranking")}
          >
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Ranking
          </Button>
        </div>
        {isAdmin && (
          <Button className="h-9 sm:h-8" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Compra
          </Button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        hasActiveFilters={search !== "" || filterPdv !== "all" || filterStatus !== "all"}
        onClear={() => {
          setSearch("");
          setFilterPdv("all");
          setFilterStatus("all");
        }}
      >
        <ProductSearchAutocomplete
          suggestions={preStockSuggestions}
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar produto..."
          countLabel={{ singular: 'pendente', plural: 'pendentes' }}
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
      {viewMode === "ranking" ? (
        <PreStockRanking items={items} />
      ) : items.length > 0 ? (
        <MobileAwarePreStockList items={items} isAdmin={isAdmin} onDelete={setDeletingId} onAllocate={openAllocateModal} deleteItem={deleteItem} />
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
        pdvs={activePdvs}
        productNames={productNames}
        onSubmit={(data) => {
          createItem.mutate(data, {
            onSuccess: () => setIsFormOpen(false),
          });
        }}
        isSubmitting={createItem.isPending}
      />

      {/* Allocate Dialog */}
      <Dialog open={!!allocatingItem} onOpenChange={(v) => !v && setAllocatingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alocar para PDV</DialogTitle>
            <DialogDescription>
              {allocatingItem && (
                <>
                  <span className="font-medium text-foreground">{allocatingItem.product_name}</span>
                  {" — "}
                  {allocatingItem.remaining_quantity} un. disponíveis
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>PDV de destino</Label>
              <Select value={allocPdvId} onValueChange={setAllocPdvId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o PDV" />
                </SelectTrigger>
                <SelectContent>
                  {activePdvs.map((pdv) => (
                    <SelectItem key={pdv.id} value={pdv.id}>
                      {pdv.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                max={allocatingItem?.remaining_quantity ?? 1}
                value={allocQty}
                onChange={(e) => setAllocQty(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Máximo: {allocatingItem?.remaining_quantity ?? 0} un.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocatingItem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAllocate}
              disabled={
                !allocPdvId ||
                !allocQty ||
                parseInt(allocQty, 10) <= 0 ||
                parseInt(allocQty, 10) > (allocatingItem?.remaining_quantity ?? 0) ||
                allocateItem.isPending
              }
            >
              {allocateItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Confirmar Alocação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
