import {
  LayoutDashboard,
  Upload,
  Package,
  ChevronLeft,
  ChevronDown,
  Building2,
  Megaphone,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useProfile } from "@/hooks/useProfile";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Upload, label: "Uploads", href: "/uploads" },
  { icon: Building2, label: "Organizações", href: "/organizations", superAdminOnly: true },
];

const stockSubItems = [
  { label: "Tabela", href: "/estoque?tab=tabela" },
  { label: "Mapa", href: "/estoque?tab=mapa" },
];

const marketingSubItems = [
  { label: "Cupons", href: "/marketing?tab=cupons" },
  { label: "Mídias", href: "/marketing?tab=midias" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onNavigate: (href: string) => void;
  stockExpanded: boolean;
  onStockExpandedChange: (expanded: boolean) => void;
  marketingExpanded: boolean;
  onMarketingExpandedChange: (expanded: boolean) => void;
}

export function AppSidebar({ 
  collapsed, 
  onToggle, 
  activeItem, 
  onNavigate,
  stockExpanded,
  onStockExpandedChange,
  marketingExpanded,
  onMarketingExpandedChange,
}: AppSidebarProps) {
  const { role } = useProfile();
  const { prefetchMap, prefetchStock, prefetchMarketing } = usePrefetchRoutes();
  const isSuperAdmin = role === "super_admin";
  const isStockActive = activeItem.startsWith("/estoque");
  const isMarketingActive = activeItem.startsWith("/marketing");

  const visibleNavItems = navItems.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.href;
    const handlePrefetch = (prefetchMap as Partial<Record<string, () => void>>)[item.href];

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <button
              onClick={() => onNavigate(item.href)}
              onMouseEnter={handlePrefetch}
              aria-label={item.label}
              className={cn(
                "w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div key={item.href}>
        <button
          onClick={() => onNavigate(item.href)}
          onMouseEnter={handlePrefetch}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span>{item.label}</span>
        </button>
      </div>
    );
  };

  const renderStockMenu = () => {
    if (collapsed) {
      const button = (
        <button
          onClick={() => onNavigate("/estoque")}
          onMouseEnter={prefetchStock}
          className={cn(
            "w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isStockActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Package className="h-5 w-5 flex-shrink-0" />
        </button>
      );

      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Estoque
          </TooltipContent>
        </Tooltip>
      );
    }

    // Auto-expand when navigating to stock
    const effectiveStockExpanded = isStockActive || stockExpanded;

    return (
      <Collapsible open={effectiveStockExpanded} onOpenChange={onStockExpandedChange}>
        <CollapsibleTrigger asChild>
          <button
            onMouseEnter={prefetchStock}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isStockActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Package className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">
              Estoque
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                effectiveStockExpanded && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 mt-1 space-y-1">
            {stockSubItems.map((subItem) => {
              const activeTab = activeItem.startsWith("/estoque")
                ? new URLSearchParams(activeItem.split("?")[1]).get("tab") || "tabela"
                : null;
              const subItemTab = subItem.href.split("=")[1];
              const isSubActive = activeTab === subItemTab;
              
              return (
                <button
                  key={subItem.href}
                  onClick={() => onNavigate(subItem.href)}
                  onMouseEnter={prefetchStock}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    isSubActive
                      ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  <span>{subItem.label}</span>
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderMarketingMenu = () => {
    if (collapsed) {
      const button = (
        <button
          onClick={() => onNavigate("/marketing")}
          onMouseEnter={prefetchMarketing}
          className={cn(
            "w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isMarketingActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Megaphone className="h-5 w-5 flex-shrink-0" />
        </button>
      );

      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Marketing
          </TooltipContent>
        </Tooltip>
      );
    }

    const effectiveMarketingExpanded = isMarketingActive || marketingExpanded;

    return (
      <Collapsible open={effectiveMarketingExpanded} onOpenChange={onMarketingExpandedChange}>
        <CollapsibleTrigger asChild>
          <button
            onMouseEnter={prefetchMarketing}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isMarketingActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Megaphone className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">
              Marketing
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                effectiveMarketingExpanded && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 mt-1 space-y-1">
            {marketingSubItems.map((subItem) => {
              const activeTab = activeItem.startsWith("/marketing")
                ? new URLSearchParams(activeItem.split("?")[1]).get("tab") || "cupons"
                : null;
              const subItemTab = subItem.href.split("=")[1];
              const isSubActive = activeTab === subItemTab;
              
              return (
                <button
                  key={subItem.href}
                  onClick={() => onNavigate(subItem.href)}
                  onMouseEnter={prefetchMarketing}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    isSubActive
                      ? "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  <span>{subItem.label}</span>
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sticky top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 flex-shrink-0 overflow-hidden",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-2">
          {collapsed ? (
            <img src="/icon-printmycase.png" alt="Print My Case" className="h-8 w-8 object-contain" />
          ) : (
            <img src="/logo-printmycase.png" alt="Print My Case" className="h-10 object-contain" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {renderNavItem(visibleNavItems[0])} {/* Dashboard */}
          {renderStockMenu()}
          {renderNavItem(visibleNavItems[1])} {/* Uploads */}
          {renderMarketingMenu()}
          {/* Super Admin items */}
          {visibleNavItems.slice(2).map(renderNavItem)}
        </nav>

        {/* Footer: Settings + Collapse Toggle */}
        <div className="p-2 border-t border-sidebar-border mt-auto flex-shrink-0 space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onNavigate("/settings")}
                  className={cn(
                    "w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    activeItem === "/settings"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Settings className="h-5 w-5 flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Configurações
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => onNavigate("/settings")}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                activeItem === "/settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span>Configurações</span>
            </button>
          )}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  aria-label="Expandir menu"
                  className="w-full flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent/50"
                >
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Expandir
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="w-full flex items-center justify-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
