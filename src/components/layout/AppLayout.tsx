import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileSidebar } from "./MobileSidebar";
import { useBreakpoint } from "@/hooks/use-mobile";
import { useSidebarPreferences } from "@/hooks/useSidebarPreferences";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { collapsed: sidebarCollapsed, updateCollapsed, reportsExpanded, updateReportsExpanded } = useSidebarPreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";

  // Auto-collapse sidebar on tablet
  const effectiveCollapsed = isTablet ? true : sidebarCollapsed;

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Sidebar (Sheet/Drawer) */}
      {isMobile && (
        <MobileSidebar
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          activeItem={location.pathname}
          onNavigate={handleNavigate}
          reportsExpanded={reportsExpanded}
          onReportsExpandedChange={updateReportsExpanded}
        />
      )}

      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <AppSidebar
          collapsed={effectiveCollapsed}
          onToggle={() => updateCollapsed(!sidebarCollapsed)}
          activeItem={location.pathname}
          onNavigate={handleNavigate}
          reportsExpanded={reportsExpanded}
          onReportsExpandedChange={updateReportsExpanded}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          isMobile={isMobile}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 md:p-5 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
