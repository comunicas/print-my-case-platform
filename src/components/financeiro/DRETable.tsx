import { useState } from "react";
import { cn } from "@/lib/utils";
import { DREData } from "@/hooks/useDRE";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import type { FinancialEntry } from "@/hooks/useFinancialEntries";

interface DRETableProps {
  dre: DREData;
  isLoading: boolean;
  entriesByCategory?: {
    deducoes: FinancialEntry[];
    implantacao: FinancialEntry[];
    fixas: FinancialEntry[];
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface DRERowProps {
  label: string;
  value: number;
  prefix?: string;
  bold?: boolean;
  highlight?: boolean;
  isLoading?: boolean;
}

function DRERow({ label, value, prefix = "", bold, highlight, isLoading }: DRERowProps) {
  const isPositive = value >= 0;
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 px-4",
        bold && "font-semibold",
        highlight && "bg-muted/50 rounded-lg"
      )}
    >
      <span className="text-sm text-muted-foreground">
        {prefix && <span className="mr-1">{prefix}</span>}
        {label}
      </span>
      {isLoading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <span
          className={cn(
            "text-sm font-mono tabular-nums",
            highlight && (isPositive ? "text-primary" : "text-destructive")
          )}
        >
          {formatCurrency(value)}
        </span>
      )}
    </div>
  );
}

interface ExpandableRowProps {
  label: string;
  total: number;
  prefix: string;
  entries: FinancialEntry[];
  isLoading?: boolean;
}

function ExpandableRow({ label, total, prefix, entries, isLoading }: ExpandableRowProps) {
  const [open, setOpen] = useState(false);

  if (entries.length === 0) {
    return <DRERow prefix={prefix} label={label} value={total} isLoading={isLoading} />;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between py-3 px-4 w-full text-left hover:bg-muted/30 transition-colors">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
            <span className="mr-1">{prefix}</span>
            {label}
          </span>
          {isLoading ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <span className="text-sm font-mono tabular-nums">
              {formatCurrency(total)}
            </span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between py-2 px-4 pl-10"
          >
            <span className="text-xs text-muted-foreground">{entry.description}</span>
            <span className="text-xs font-mono tabular-nums text-muted-foreground">
              {formatCurrency(Number(entry.amount))}
            </span>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DRETable({ dre, isLoading, entriesByCategory }: DRETableProps) {
  const deducoes = entriesByCategory?.deducoes ?? [];
  const implantacao = entriesByCategory?.implantacao ?? [];
  const fixas = entriesByCategory?.fixas ?? [];

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-base">Demonstração do Resultado</h3>
      </div>
      <div className="divide-y">
        <DRERow
          prefix="(+)"
          label="Faturamento Bruto"
          value={dre.faturamentoBruto}
          isLoading={isLoading}
        />
        <ExpandableRow
          prefix="(−)"
          label="Deduções da Venda"
          total={dre.deducoes}
          entries={deducoes}
          isLoading={isLoading}
        />
        <DRERow
          prefix="(=)"
          label="Receita Líquida"
          value={dre.receitaLiquida}
          bold
          highlight
          isLoading={isLoading}
        />
        <ExpandableRow
          prefix="(−)"
          label="Despesas de Implantação"
          total={dre.despesasImplantacao}
          entries={implantacao}
          isLoading={isLoading}
        />
        <ExpandableRow
          prefix="(−)"
          label="Despesas Fixas"
          total={dre.despesasFixas}
          entries={fixas}
          isLoading={isLoading}
        />
        <DRERow
          prefix="(=)"
          label="Resultado Operacional"
          value={dre.resultadoOperacional}
          bold
          highlight
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
