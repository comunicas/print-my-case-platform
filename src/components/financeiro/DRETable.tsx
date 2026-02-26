import { cn } from "@/lib/utils";
import { DREData } from "@/hooks/useDRE";
import { Skeleton } from "@/components/ui/skeleton";

interface DRETableProps {
  dre: DREData;
  isLoading: boolean;
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

export function DRETable({ dre, isLoading }: DRETableProps) {
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
        <DRERow
          prefix="(−)"
          label="Deduções da Venda"
          value={dre.deducoes}
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
        <DRERow
          prefix="(−)"
          label="Despesas de Implantação"
          value={dre.despesasImplantacao}
          isLoading={isLoading}
        />
        <DRERow
          prefix="(−)"
          label="Despesas Fixas"
          value={dre.despesasFixas}
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
