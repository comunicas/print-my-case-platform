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
  muted?: boolean;
  isLoading?: boolean;
}

function DRERow({ label, value, prefix = "", bold, highlight, muted, isLoading }: DRERowProps) {
  const isPositive = value >= 0;
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3 px-4",
        bold && "font-semibold",
        highlight && "bg-muted/50 rounded-lg",
        muted && "opacity-50"
      )}
    >
      <span className={cn("text-sm", muted ? "text-muted-foreground/60" : "text-muted-foreground")}>
        {prefix && <span className="mr-1">{prefix}</span>}
        {label}
      </span>
      {isLoading ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <span
          className={cn(
            "text-sm font-mono tabular-nums",
            highlight && (isPositive ? "text-primary" : "text-destructive"),
            muted && "text-muted-foreground/60"
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
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform shrink-0", open && "rotate-90")} />
            <span className="mr-1">{prefix}</span>
            {label}
            <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
              {entries.length}
            </span>
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
        <div className="border-l-2 border-muted ml-6 mb-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between py-1.5 px-4 pl-4"
            >
              <span className="text-xs text-muted-foreground">{entry.description}</span>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {formatCurrency(Number(entry.amount))}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MarginRow({
  label,
  numerator,
  denominator,
  absoluteValue,
  isLoading,
}: {
  label: string;
  numerator: number;
  denominator: number;
  absoluteValue: number;
  isLoading?: boolean;
}) {
  const pct = denominator !== 0 ? (numerator / denominator) * 100 : null;
  const isPositive = pct !== null && pct >= 0;

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {isLoading ? (
        <Skeleton className="h-5 w-20" />
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono tabular-nums text-muted-foreground">
            {formatCurrency(absoluteValue)}
          </span>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              pct === null
                ? "bg-muted text-muted-foreground"
                : isPositive
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
            )}
          >
            {pct === null ? "—" : `${pct.toFixed(1)}%`}
          </span>
        </div>
      )}
    </div>
  );
}

function SectionSeparator() {
  return <div className="border-t border-dashed border-muted-foreground/20 mx-4" />;
}

export function DRETable({ dre, isLoading, entriesByCategory }: DRETableProps) {
  const deducoes = entriesByCategory?.deducoes ?? [];
  const implantacao = entriesByCategory?.implantacao ?? [];
  const fixas = entriesByCategory?.fixas ?? [];

  // Labels dinâmicos
  const cmvLabel = dre.unitCost > 0
    ? `CMV (${dre.salesCount} un × ${formatCurrency(dre.unitCost)})`
    : "CMV (Custo Mercadoria Vendida)";

  const stoneLabel = dre.stoneRate > 0
    ? `Taxas Stone (${(dre.stoneRate * 100).toFixed(1)}% cartão)`
    : "Taxas Stone (MDR)";

  const taxLabel = dre.taxRate > 0
    ? `Impostos sobre vendas (${(dre.taxRate * 100).toFixed(1)}%)`
    : "Impostos sobre vendas";

  

  return (
    <div className="rounded-xl border bg-card">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-base">Demonstração do Resultado (DRE)</h3>
      </div>
      <div className="divide-y divide-transparent">
        {/* Receita Bruta */}
        <DRERow
          prefix="(+)"
          label="Receita Bruta"
          value={dre.receitaBruta}
          isLoading={isLoading}
        />

        {/* Impostos */}
        <DRERow
          prefix="(−)"
          label={taxLabel}
          value={dre.impostos}
          isLoading={isLoading}
          muted={dre.taxRate === 0}
        />

        {/* Reembolsos / Deduções */}
        <ExpandableRow
          prefix="(−)"
          label="Reembolsos / Deduções"
          total={dre.reembolsos}
          entries={deducoes}
          isLoading={isLoading}
        />

        {/* Receita Líquida */}
        <DRERow
          prefix="(=)"
          label="Receita Líquida"
          value={dre.receitaLiquida}
          bold
          highlight
          isLoading={isLoading}
        />

        <SectionSeparator />

        {/* CMV */}
        <DRERow
          prefix="(−)"
          label={cmvLabel}
          value={dre.cmv}
          isLoading={isLoading}
          muted={dre.unitCost === 0}
        />

        {/* Taxas Stone */}
        <DRERow
          prefix="(−)"
          label={stoneLabel}
          value={dre.taxasStone}
          isLoading={isLoading}
          muted={dre.stoneRate === 0}
        />

        {/* Lucro Bruto */}
        <DRERow
          prefix="(=)"
          label="Lucro Bruto"
          value={dre.lucroBruto}
          bold
          highlight
          isLoading={isLoading}
        />

        <SectionSeparator />

        {/* Despesas Fixas */}
        <ExpandableRow
          prefix="(−)"
          label="Despesas Fixas (OPEX)"
          total={dre.despesasFixas}
          entries={fixas}
          isLoading={isLoading}
        />

        {/* Resultado Operacional */}
        <DRERow
          prefix="(=)"
          label="Resultado Operacional (EBITDA)"
          value={dre.resultadoOperacional}
          bold
          highlight
          isLoading={isLoading}
        />

        {/* Implantação - condicional */}
        {dre.implantacao > 0 && (
          <>
            <SectionSeparator />
            <ExpandableRow
              prefix="(−)"
              label="Implantação (one-off)"
              total={dre.implantacao}
              entries={implantacao}
              isLoading={isLoading}
            />
          </>
        )}

        {/* Resultado do Mês */}
        <div className="bg-muted/30">
          <DRERow
            prefix="(=)"
            label="Resultado do Mês"
            value={dre.resultadoMes}
            bold
            highlight
            isLoading={isLoading}
          />
        </div>

        {/* Margens */}
        <SectionSeparator />
        <div className="py-2 px-4 space-y-1 rounded-b-xl">
          <MarginRow
            label="Margem Bruta"
            numerator={dre.lucroBruto}
            denominator={dre.receitaLiquida}
            absoluteValue={dre.lucroBruto}
            isLoading={isLoading}
          />
          <MarginRow
            label="Margem Operacional"
            numerator={dre.resultadoOperacional}
            denominator={dre.receitaLiquida}
            absoluteValue={dre.resultadoOperacional}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
