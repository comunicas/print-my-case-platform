import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Search, Phone, TrendingUp, Users, Package, Download, Trash2, UserPlus,
} from "lucide-react";
import { useCatalogLeads } from "@/hooks/useCatalogLeads";
import { useDebounce } from "@/hooks/useDebounce";
import { DateRangeFilter, DateRange } from "@/components/dashboard/DateRangeFilter";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CatalogLeadsSettings() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  });

  const { leads, stats, isLoading, deleteLead, exportCSV } = useCatalogLeads({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    search,
  });

  const handleOpenWhatsApp = (phone: string, productName: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá! Vi que você se interessou pelo modelo: ${productName}. Como posso ajudar?`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteLead.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                  <p className="text-2xl font-bold">{stats.todayCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Semana</p>
                  <p className="text-2xl font-bold">{stats.weekCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Produto</p>
                  <p className="text-lg font-bold truncate max-w-[120px]" title={stats.topProduct || "—"}>
                    {stats.topProduct || "—"}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leads Capturados</CardTitle>
            <CardDescription>
              Contatos capturados pelo catálogo público
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por telefone ou produto..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={exportCSV} className="gap-2 shrink-0">
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
              <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-1">Nenhum lead encontrado</h3>
                <p className="text-sm">
                  {search
                    ? "Tente ajustar os filtros de busca."
                    : "Os leads capturados pelo catálogo aparecerão aqui."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Catálogo</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">
                            {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto"
                              onClick={() => handleOpenWhatsApp(lead.phone, lead.product_name)}
                            >
                              {lead.phone}
                            </Button>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{lead.product_name}</TableCell>
                          <TableCell className="text-muted-foreground">{lead.catalog_slug}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenWhatsApp(lead.phone, lead.product_name)}
                                title="Abrir WhatsApp"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirmId(lead.id)}
                                title="Excluir"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {leads.map((lead) => (
                    <Card key={lead.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{lead.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(lead.id)}
                          className="text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{lead.catalog_slug}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenWhatsApp(lead.phone, lead.product_name)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        {lead.phone}
                      </Button>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lead será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
