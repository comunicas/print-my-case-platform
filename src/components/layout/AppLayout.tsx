import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileSidebar } from "./MobileSidebar";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useSidebarPreferences } from "@/hooks/useSidebarPreferences";
import { ErrorBoundary, PageErrorFallback } from "@/components/ui/ErrorBoundary";

interface AppLayoutProps {
  children: React.ReactNode;
  /**
   * When true, the main content area becomes a non-scrolling flex container.
   * Use for full-height pages (chat, etc.) that manage their own internal
   * scroll and need a sticky footer pinned to the viewport bottom.
   */
  fullHeight?: boolean;
}

export function AppLayout({ children, fullHeight = false }: AppLayoutProps) {
  const { 
    collapsed: sidebarCollapsed, 
    updateCollapsed, 
    stockExpanded, 
    updateStockExpanded,
    marketingExpanded,
    updateMarketingExpanded,
  } = useSidebarPreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";

  // Auto-collapse sidebar on tablet
  const effectiveCollapsed = isTablet ? true : sidebarCollapsed;

  // Include search params for correct active tab detection
  const activeItem = location.pathname + location.search;

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  return (
    <div className="h-screen flex w-full bg-background overflow-hidden">
      {/* Mobile Sidebar (Sheet/Drawer) */}
      {isMobile && (
        <MobileSidebar
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          activeItem={activeItem}
          onNavigate={handleNavigate}
          stockExpanded={stockExpanded}
          onStockExpandedChange={updateStockExpanded}
          marketingExpanded={marketingExpanded}
          onMarketingExpandedChange={updateMarketingExpanded}
        />
      )}

      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <AppSidebar
          collapsed={effectiveCollapsed}
          onToggle={() => updateCollapsed(!sidebarCollapsed)}
          activeItem={activeItem}
          onNavigate={handleNavigate}
          stockExpanded={stockExpanded}
          onStockExpandedChange={updateStockExpanded}
          marketingExpanded={marketingExpanded}
          onMarketingExpandedChange={updateMarketingExpanded}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <AppHeader
          isMobile={isMobile}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main
          className={
            fullHeight
              ? "flex-1 flex flex-col min-h-0 overflow-hidden p-3 sm:p-4 md:p-5 lg:p-6"
              : "flex-1 flex flex-col min-h-0 p-4 md:p-5 lg:p-6 overflow-y-auto overflow-x-hidden"
          }
        >
          <ErrorBoundary fallback={<PageErrorFallback />}>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
