import { useState, useCallback } from "react";
import { startOfMonth, subMonths, addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Wallet, Copy } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDVFilter } from "@/components/ui/PDVFilter";
import {
  DRETable,
  DREConfigCard,
  FinancialEntryForm,
  FinancialEntriesList,
  MonthlyBreakdownTable,
  PDVComparisonCards,
  ResumoKPICards,
} from "@/components/financeiro";
import { useFinancialEntries, type FinancialEntry } from "@/hooks/useFinancialEntries";
import { useDRE } from "@/hooks/useDRE";
import { useProfile } from "@/hooks/useProfile";
import { usePDVs } from "@/hooks/usePDVs";
import { useDefaultPdvPreference } from "@/hooks/useDefaultPdvPreference";
import { useMonthlyDRESummary } from "@/hooks/useMonthlyDRESummary";
import { usePDVComparison } from "@/hooks/usePDVComparison";
import type { FinancialEntryFormData } from "@/lib/schemas/financial";

export default function Financeiro() {
  const { isAdmin } = useProfile();
  const { pdvs } = usePDVs();
  const { selectedPdvId, setSelectedPdvId, wasAutoApplied } = useDefaultPdvPreference({ pdvs });

  const [referenceMonth, setReferenceMonth] = useState(() => startOfMonth(new Date()));
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<FinancialEntry | null>(null);

  const pdvId = selectedPdvId === "all" ? undefined : selectedPdvId;
  const showAllPdvs = selectedPdvId === "all" || !selectedPdvId;

  const { dre, entriesByCategory, isLoading: dreLoading } = useDRE({ referenceMonth, pdvId });
  const {
    entries,
    isLoading: entriesLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    copyFromPreviousMonth,
  } = useFinancialEntries({ referenceMonth, pdvId });

  // Resumo tab data
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyDRESummary({ pdvId });
  const { data: pdvComparison, isLoading: comparisonLoading, showComparison } = usePDVComparison();

  const handlePrevMonth = () => setReferenceMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setReferenceMonth((m) => addMonths(m, 1));

  const handleSubmit = useCallback(
    (data: FinancialEntryFormData) => {
      if (editEntry) {
        updateEntry.mutate(
          {
            id: editEntry.id,
            category: data.category,
            description: data.description,
            amount: data.amount,
            reference_month: format(startOfMonth(data.reference_month), "yyyy-MM-dd") as unknown as string,
            pdv_id: data.pdv_id ?? null,
          } as Parameters<typeof updateEntry.mutate>[0],
          { onSuccess: () => { setFormOpen(false); setEditEntry(null); } }
        );
      } else {
        createEntry.mutate(
          {
            category: data.category,
            description: data.description,
            amount: data.amount,
            reference_month: data.reference_month,
            pdv_id: data.pdv_id ?? null,
          },
          { onSuccess: () => setFormOpen(false) }
        );
      }
    },
    [editEntry, createEntry, updateEntry]
  );

  const handleEdit = (entry: FinancialEntry) => {
    setEditEntry(entry);
    setFormOpen(true);
  };

  const handleOpenNew = () => {
    setEditEntry(null);
    setFormOpen(true);
  };

  const monthLabel = format(referenceMonth, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Financeiro</h1>
          </div>
          <div className="flex items-center gap-2">
            <PDVFilter
              value={selectedPdvId}
              onChange={setSelectedPdvId}
              pdvs={pdvs}
              showAutoAppliedBadge={wasAutoApplied}
            />
            {isAdmin && (
              <Button onClick={handleOpenNew} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nova Despesa
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="resumo">
          <TabsList className="w-full">
            <TabsTrigger value="resumo" className="flex-1">Resumo</TabsTrigger>
            <TabsTrigger value="dre" className="flex-1">DRE</TabsTrigger>
            <TabsTrigger value="despesas" className="flex-1">Despesas</TabsTrigger>
          </TabsList>

          {/* === Aba Resumo === */}
          <TabsContent value="resumo" className="space-y-6">
            <MonthlyBreakdownTable data={monthlyData} isLoading={monthlyLoading} />
            {showAllPdvs && showComparison && (
              <PDVComparisonCards data={pdvComparison} isLoading={comparisonLoading} />
            )}
          </TabsContent>

          {/* === Aba DRE === */}
          <TabsContent value="dre" className="space-y-6">
            {isAdmin && <DREConfigCard pdvId={pdvId} />}

            {/* Month selector */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium capitalize min-w-[180px] text-center">
                {monthLabel}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <DRETable dre={dre} isLoading={dreLoading} entriesByCategory={entriesByCategory} />
          </TabsContent>

          {/* === Aba Despesas === */}
          <TabsContent value="despesas" className="space-y-6">
            {/* Month selector */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium capitalize min-w-[180px] text-center">
                {monthLabel}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Copy from previous month banner */}
            {isAdmin && !entriesLoading && entries.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex items-center gap-4 py-4 px-5">
                  <Copy className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Nenhuma despesa neste mês</p>
                    <p className="text-xs text-muted-foreground">
                      Deseja copiar as despesas fixas e deduções do mês anterior?
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyFromPreviousMonth.mutate({ targetMonth: referenceMonth })}
                    disabled={copyFromPreviousMonth.isPending}
                  >
                    {copyFromPreviousMonth.isPending ? "Copiando…" : "Copiar despesas"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Entries list */}
            <div>
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
                Despesas do mês
              </h2>
              <FinancialEntriesList
                entries={entries}
                isLoading={entriesLoading}
                isAdmin={isAdmin}
                onEdit={handleEdit}
                onDelete={(id) => deleteEntry.mutate(id)}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <FinancialEntryForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditEntry(null);
        }}
        onSubmit={handleSubmit}
        isPending={createEntry.isPending || updateEntry.isPending}
        editEntry={editEntry}
        defaultMonth={referenceMonth}
      />
    </AppLayout>
  );
}
