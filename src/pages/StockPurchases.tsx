import { AppLayout } from "@/components/layout/AppLayout";
import { PreStockTab } from "@/components/upload/PreStockTab";

export default function StockPurchases() {
  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Compras</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerenciamento de compras e pré-estoque
          </p>
        </div>
        <PreStockTab />
      </div>
    </AppLayout>
  );
}
