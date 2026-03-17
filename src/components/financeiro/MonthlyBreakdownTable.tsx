import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  isSeparator?: boolean;
  indent?: boolean;
  bold?: boolean;
}

const rows: RowDef[] = [
  { label: "Receita Bruta", key: "receita", format: formatCurrency, bold: true },
  { label: "(-) Impostos", key: "impostos", format: formatCurrency, indent: true },
  { label: "(-) Reembolsos / Deduções", key: "reembolsos", format: formatCurrency, indent: true },
  { label: "Receita Líquida", key: "receitaLiquida", format: formatCurrency, bold: true, colorFn: getResultColor },
  { label: "(-) CMV", key: "cmv", format: formatCurrency, indent: true },
  { label: "(-) Taxas Stone", key: "taxasStone", format: formatCurrency, indent: true },
  { label: "Lucro Bruto", key: "lucroBruto", format: formatCurrency, bold: true, colorFn: getResultColor },
  { label: "(-) Despesas Fixas", key: "despesasFixas", format: formatCurrency, indent: true },
  { label: "Resultado Operacional", key: "resultadoOperacional", format: formatCurrency, bold: true, colorFn: getResultColor },
  { label: "(-) Implantação", key: "implantacao", format: formatCurrency, indent: true },
  { label: "Resultado do Mês", key: "resultado", format: formatCurrency, bold: true, colorFn: getResultColor },
  { label: "Margem Operacional", key: "margem", format: (v: number) => `${v.toFixed(1)}%`, colorFn: getMarginColor, bold: true },
  { label: "Transações", key: "transacoes", format: (v: number) => v.toLocaleString("pt-BR") },
];

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
                    {row.label}
                  </TableCell>
                  {data.map((m) => {
                    const value = m[row.key] as number;
                    const colorClass = row.colorFn ? row.colorFn(value) : undefined;
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
                        {row.format(value)}
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
  );
}
