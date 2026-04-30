import {
  LayoutDashboard,
  Upload,
  Package,
  ChevronLeft,
  Building2,
  Megaphone,
  Wallet,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollapsibleNavMenu } from "./CollapsibleNavMenu";
import { useProfile } from "@/hooks/useProfile";
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Upload, label: "Uploads", href: "/uploads" },
  { icon: Building2, label: "Organizações", href: "/organizations", superAdminOnly: true },
];

const stockSubItems = [
  { label: "Resumo", href: "/estoque" },
  { label: "Tabela", href: "/estoque/tabela" },
  { label: "Compras", href: "/estoque/compras" },
];

const marketingSubItems = [
  { label: "Cupons", href: "/marketing?tab=cupons" },
  { label: "Mídias", href: "/marketing?tab=midias" },
  { label: "Pedidos", href: "/marketing?tab=pedidos" },
  { label: "Vendas", href: "/marketing?tab=vendas" },
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
  const { prefetchMap, prefetchMarketing } = usePrefetchRoutes();
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "super_admin" || role === "org_admin";
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

  // Navigation render
  const stockMenu = (
    <CollapsibleNavMenu
      icon={Package}
      label="Estoque"
      href="/estoque"
      subItems={stockSubItems}
      collapsed={collapsed}
      isActive={isStockActive}
      expanded={stockExpanded}
      onExpandedChange={onStockExpandedChange}
      onNavigate={onNavigate}
      onPrefetch={undefined}
      activeItem={activeItem}
      defaultSubTab="tabela"
    />
  );

  const marketingMenu = (
    <CollapsibleNavMenu
      icon={Megaphone}
      label="Marketing"
      href="/marketing"
      subItems={marketingSubItems}
      collapsed={collapsed}
      isActive={isMarketingActive}
      expanded={marketingExpanded}
      onExpandedChange={onMarketingExpandedChange}
      onNavigate={onNavigate}
      onPrefetch={prefetchMarketing}
      activeItem={activeItem}
      defaultSubTab="cupons"
    />
  );

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
          {stockMenu}
          {renderNavItem(visibleNavItems[1])} {/* Uploads */}
          {marketingMenu}
          {renderNavItem({ icon: Wallet, label: "Financeiro", href: "/financeiro" })}
          {isAdmin && renderNavItem({ icon: Sparkles, label: "Assistente IA", href: "/assistente" })}
          {/* Super Admin items */}
          {visibleNavItems.slice(2).map(renderNavItem)}
        </nav>

        {/* Footer: Settings + Collapse Toggle */}
        <div className="p-2 border-t border-sidebar-border mt-auto flex-shrink-0 space-y-1">
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
