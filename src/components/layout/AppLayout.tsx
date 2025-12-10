import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MobileSidebar } from "./MobileSidebar";
import { useBreakpoint } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("/");
  const breakpoint = useBreakpoint();

  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";

  // Auto-collapse sidebar on tablet
  const effectiveCollapsed = isTablet ? true : sidebarCollapsed;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Mobile Sidebar (Sheet/Drawer) */}
      {isMobile && (
        <MobileSidebar
          open={mobileMenuOpen}
          onOpenChange={setMobileMenuOpen}
          activeItem={activeItem}
          onNavigate={setActiveItem}
        />
      )}

      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <AppSidebar
          collapsed={effectiveCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeItem={activeItem}
          onNavigate={setActiveItem}
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
