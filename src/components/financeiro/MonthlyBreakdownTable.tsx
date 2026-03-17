import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import type { MonthSummary } from "@/hooks/useMonthlyDRESummary";

interface MonthlyBreakdownTableProps {
  data: MonthSummary[];
  isLoading?: boolean;
}

function getMarginColor(value: number) {
  if (value >= 20) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 10) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function getResultColor(value: number) {
  return value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
}

interface RowDef {
  label: string;
  key: keyof MonthSummary;
  format: (v: number) => string;
  colorFn?: (v: number) => string;
  indent?: boolean;
  bold?: boolean;
  labelTooltip: string;
}

const rows: RowDef[] = [
  { label: "Receita Bruta", key: "receita", format: formatCurrency, bold: true, labelTooltip: "Total de vendas brutas no período" },
  { label: "(-) Custos Totais", key: "custos", format: formatCurrency, indent: true, labelTooltip: "Impostos + Reembolsos + CMV + Taxas Stone + Desp. Fixas + Implantação" },
  { label: "Resultado do Mês", key: "resultado", format: formatCurrency, bold: true, colorFn: getResultColor, labelTooltip: "Receita Bruta − Custos Totais" },
  { label: "Margem Operacional", key: "margem", format: (v: number) => `${v.toFixed(1)}%`, colorFn: getMarginColor, bold: true, labelTooltip: "Resultado Operacional ÷ Receita Líquida × 100" },
  { label: "Transações", key: "transacoes", format: (v: number) => v.toLocaleString("pt-BR"), labelTooltip: "Quantidade de vendas realizadas" },
];

function getCellTooltip(row: RowDef, m: MonthSummary): string | null {
  switch (row.key) {
    case "custos":
      return [
        `Impostos: ${formatCurrency(m.impostos)}`,
        `Reembolsos: ${formatCurrency(m.reembolsos)}`,
        `CMV: ${formatCurrency(m.cmv)}`,
        `Taxas Stone: ${formatCurrency(m.taxasStone)}`,
        `Desp. Fixas: ${formatCurrency(m.despesasFixas)}`,
        `Implantação: ${formatCurrency(m.implantacao)}`,
        `───────────`,
        `Total: ${formatCurrency(m.custos)}`,
      ].join("\n");
    case "resultado":
      return [
        `Receita Bruta: ${formatCurrency(m.receita)}`,
        `(-) Custos: ${formatCurrency(m.custos)}`,
        `───────────`,
        `Resultado: ${formatCurrency(m.resultado)}`,
      ].join("\n");
    case "margem":
      return [
        `Res. Operacional: ${formatCurrency(m.resultadoOperacional)}`,
        `Receita Líquida: ${formatCurrency(m.receitaLiquida)}`,
        `───────────`,
        `Margem: ${m.margem.toFixed(1)}%`,
      ].join("\n");
    default:
      return null;
  }
}

export function MonthlyBreakdownTable({ data, isLoading }: MonthlyBreakdownTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 min-w-[140px]" />
                  {data.map((m) => (
                    <TableHead key={m.label} className="text-center min-w-[100px] capitalize">
                      {m.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.key}
                    className={cn(
                      row.bold && "bg-muted/30",
                      (row.key === "resultado" || row.key === "resultadoOperacional") && "border-t-2 border-border"
                    )}
                  >
                    <TableCell
                      className={cn(
                        "sticky left-0 bg-card z-10 text-sm whitespace-nowrap",
                        row.indent && "pl-6 text-muted-foreground",
                        row.bold && "font-semibold bg-muted/30"
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/40">
                            {row.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[240px] text-xs">
                          {row.labelTooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    {data.map((m) => {
                      const value = m[row.key] as number;
                      const colorClass = row.colorFn ? row.colorFn(value) : undefined;
                      const cellTip = getCellTooltip(row, m);

                      const cellContent = (
                        <span className={cellTip ? "cursor-help border-b border-dashed border-muted-foreground/30" : undefined}>
                          {row.format(value)}
                        </span>
                      );

                      return (
                        <TableCell
                          key={m.label}
                          className={cn(
                            "text-center text-sm tabular-nums",
                            colorClass,
                            row.bold && "font-semibold",
                            row.indent && "text-muted-foreground"
                          )}
                        >
                          {cellTip ? (
                            <Tooltip>
                              <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs whitespace-pre-line font-mono">
                                {cellTip}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            cellContent
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
