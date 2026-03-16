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
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) return null;

  const rows = [
    { label: "Receita", key: "receita" as const, format: formatCurrency },
    { label: "Custos", key: "custos" as const, format: formatCurrency },
    { label: "Resultado", key: "resultado" as const, format: formatCurrency, colorFn: getResultColor },
    { label: "Margem", key: "margem" as const, format: (v: number) => `${v.toFixed(1)}%`, colorFn: getMarginColor },
  ];

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
                <TableHead className="sticky left-0 bg-card z-10 min-w-[100px]" />
                {data.map((m) => (
                  <TableHead key={m.label} className="text-center min-w-[100px] capitalize">
                    {m.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm">
                    {row.label}
                  </TableCell>
                  {data.map((m) => {
                    const value = m[row.key];
                    const colorClass = row.colorFn ? row.colorFn(value) : undefined;
                    return (
                      <TableCell
                        key={m.label}
                        className={cn("text-center text-sm tabular-nums", colorClass)}
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
