import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Package } from "lucide-react";
import { usePublicStock } from "@/hooks/usePublicStock";
import { PublicStockSearch, PublicStockList, PublicBrandFilter, ProductRequestForm, ProductCodeModal } from "@/components/public";

export default function PublicStock() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  
  const {
    organization,
    isLoadingOrganization,
    stock,
    isLoadingStock,
    submitRequest,
    isSubmitting,
  } = usePublicStock(orgSlug);

  if (isLoadingOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Package className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Catálogo não encontrado</h1>
        <p className="text-muted-foreground text-center">
          Este catálogo não existe ou não está disponível no momento.
        </p>
      </div>
    );
  }

  const catalogCodeEnabled = organization.catalog_code_enabled && !!organization.catalog_code;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-printmycase.png"
              alt="PrintMyCase"
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="font-semibold text-lg">{organization.name}</h1>
              <p className="text-sm text-muted-foreground">Catálogo de Produtos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-4 max-w-2xl">
        {/* Search */}
        <PublicStockSearch value={searchTerm} onChange={setSearchTerm} items={stock} />

        {/* Brand Filter */}
        <PublicBrandFilter
          items={stock}
          selectedBrand={selectedBrand}
          onBrandChange={setSelectedBrand}
        />

        {/* Stock List */}
        {isLoadingStock ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <PublicStockList 
            items={stock} 
            searchTerm={searchTerm} 
            selectedBrand={selectedBrand}
            catalogCodeEnabled={catalogCodeEnabled}
            onProductClick={setSelectedProduct}
          />
        )}

        {/* Request Form */}
        <ProductRequestForm
          organizationId={organization.id}
          onSubmit={submitRequest}
          isSubmitting={isSubmitting}
        />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Powered by PrintMyCase
        </div>
      </footer>

      {/* Product Code Modal */}
      {catalogCodeEnabled && (
        <ProductCodeModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          code={organization.catalog_code!}
          productName={selectedProduct || ""}
        />
      )}
    </div>
  );
}
