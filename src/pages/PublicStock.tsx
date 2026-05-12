import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Package, MapPin, X, Share2, Copy, Navigation } from "lucide-react";
import { toast } from "sonner";
import { usePublicStock } from "@/hooks/usePublicStock";
import { PublicStockSearch, PublicStockList, PublicStockListSkeleton, PublicBrandFilter, ProductRequestForm, ProductCodeModal } from "@/components/public";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { extractBrandFromProductName } from "@/lib/productNormalization";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

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
    refetchStock,
    isRefetching,
  } = usePublicStock(orgSlug);

  const { vibrate } = useHapticFeedback();

  // Facebook Pixel: ViewContent when catalog loads
  useEffect(() => {
    if (organization && typeof window.fbq === "function") {
      window.fbq("track", "ViewContent", {
        content_name: organization.pdv_name || organization.name,
        content_category: "catalog",
      });
    }
  }, [organization]);

  const handleRefresh = useCallback(async () => {
    await refetchStock();
  }, [refetchStock]);

  const handleShare = useCallback(async () => {
    vibrate("light");
    const url = window.location.href;
    const pdvName = organization?.pdv_name || organization?.name || "nosso catálogo";
    const message = `O match perfeito para o seu celular está aqui. ❤️ Clique e descubra:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: pdvName,
          text: message,
          url: url,
        });
        toast.success("Catálogo compartilhado com sucesso!");
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
    window.open(whatsappUrl, '_blank');
  }, [organization, vibrate]);

  const handleCopyLink = useCallback(async () => {
    vibrate("success");
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }, [vibrate]);

  const handleOpenGoogleMaps = useCallback(() => {
    vibrate("light");
    const address = organization?.pdv_location;
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  }, [organization?.pdv_location, vibrate]);

  const handleOpenWaze = useCallback(() => {
    vibrate("light");
    const address = organization?.pdv_location;
    if (!address) return;
    const url = `https://waze.com/ul?q=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  }, [organization?.pdv_location, vibrate]);

  const scrollToLocation = useCallback(() => {
    vibrate("light");
    const locationCard = document.getElementById('location-card');
    locationCard?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [vibrate]);

  // Pre-filter items once - must be before early returns
  const filteredItems = useMemo(() => {
    return stock.filter((item) => {
      const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = !selectedBrand || extractBrandFromProductName(item.product_name) === selectedBrand;
      return matchesSearch && matchesBrand;
    });
  }, [stock, searchTerm, selectedBrand]);

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

  const catalogCodeEnabled = organization.catalog_code_enabled && !!organization.catalog_code && !!organization.catalog_qrcode_url;

  const hasActiveFilters = searchTerm || selectedBrand;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedBrand(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="container mx-auto px-5 py-8 space-y-6 max-w-md">
          {/* Logo e Info - Centralizado */}
          <div className="flex flex-col items-center text-center space-y-3">
            <img
              src="/a33970fb-78ec-4651-a5e5-98cb6db17573.png"
              alt="PrintMyCase"
              className="h-16 w-16 object-contain rounded-2xl shadow-lg bg-white/10 p-2"
            />
            <div className="space-y-1">
              <h1 className="font-bold text-2xl tracking-tight">
                {organization.pdv_name || organization.name}
              </h1>
              <p className="text-white/70 text-sm font-medium">
                Catálogo de Produtos
              </p>
            </div>
          </div>

          {/* Search */}
          <PublicStockSearch 
            value={searchTerm} 
            onChange={setSearchTerm} 
            items={stock} 
            variant="hero"
          />

          {/* Brand Filter */}
          <PublicBrandFilter
            items={stock}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            variant="hero"
          />

          {/* Barra de ações no footer do hero */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/20">
            {organization.pdv_location && (
              <Button
                variant="ghost"
                size="sm"
                onClick={scrollToLocation}
                className="text-white/90 hover:text-white hover:bg-white/20 rounded-full px-4 gap-2 h-11 min-w-[120px] active:scale-95 transition-transform touch-manipulation"
                aria-label="Ver localização da loja"
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Localização</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-white/90 hover:text-white hover:bg-white/20 rounded-full h-11 w-11 active:scale-95 transition-transform touch-manipulation"
              title="Compartilhar catálogo"
              aria-label="Compartilhar catálogo via WhatsApp ou redes sociais"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyLink}
              className="text-white/90 hover:text-white hover:bg-white/20 rounded-full h-11 w-11 active:scale-95 transition-transform touch-manipulation"
              title="Copiar link"
              aria-label="Copiar link do catálogo para a área de transferência"
            >
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Pull-to-Refresh Content */}
      <PullToRefresh 
        onRefresh={handleRefresh} 
        isRefreshing={isRefetching}
        disabled={isLoadingStock}
      >
        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Results Counter */}
          {!isLoadingStock && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? 'modelo encontrado' : 'modelos encontrados'}
              </p>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          )}

          {/* Stock List */}
{isLoadingStock ? (
            <PublicStockListSkeleton count={6} showQrIcon={catalogCodeEnabled} />
          ) : (
            <PublicStockList 
              items={filteredItems}
              hasActiveFilters={!!hasActiveFilters}
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

        {/* Location Card */}
        {organization.pdv_location && (
          <div className="container mx-auto px-4 py-6 max-w-2xl">
            <div id="location-card" className="bg-card border rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1">Onde nos encontrar</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {organization.pdv_location}
                  </p>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenGoogleMaps}
                  className="flex-1"
                  aria-label="Abrir localização no Google Maps"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Google Maps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenWaze}
                  className="flex-1"
                  aria-label="Abrir localização no Waze"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Waze
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t bg-card mt-8">
          <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
            Powered by PrintMyCase
          </div>
        </footer>
      </PullToRefresh>

      {/* Product Code Modal */}
      {catalogCodeEnabled && (
        <ProductCodeModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          code={organization.catalog_code!}
          productName={selectedProduct || ""}
          qrcodeUrl={organization.catalog_qrcode_url!}
          modalText={organization.catalog_modal_text}
          organizationId={organization.id}
          pdvId={organization.catalog_pdv_id || null}
          catalogSlug={orgSlug || ""}
          onOpen={() => {
            if (typeof window.fbq === "function") {
              window.fbq("track", "Lead", {
                content_name: selectedProduct,
              });
            }
          }}
        />
      )}
    </div>
  );
}
