import {
  LayoutDashboard,
  Upload,
  Package,
  Megaphone,
  Wallet,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CollapsibleNavMenu } from "./CollapsibleNavMenu";
import { useProfile } from "@/hooks/useProfile";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Upload, label: "Uploads", href: "/uploads" },
];

const bottomNavItems: NavItem[] = [
  { icon: Building2, label: "Organizações", href: "/organizations", superAdminOnly: true },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

const stockSubItems = [
  { label: "Tabela", href: "/estoque?tab=tabela" },
  { label: "Mapa", href: "/estoque?tab=mapa" },
];

const marketingSubItems = [
  { label: "Cupons", href: "/marketing?tab=cupons" },
  { label: "Mídias", href: "/marketing?tab=midias" },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItem: string;
  onNavigate: (href: string) => void;
  stockExpanded: boolean;
  onStockExpandedChange: (expanded: boolean) => void;
  marketingExpanded: boolean;
  onMarketingExpandedChange: (expanded: boolean) => void;
}

export function MobileSidebar({ 
  open, 
  onOpenChange, 
  activeItem, 
  onNavigate,
  stockExpanded,
  onStockExpandedChange,
  marketingExpanded,
  onMarketingExpandedChange,
}: MobileSidebarProps) {
  const { role } = useProfile();
  const isSuperAdmin = role === "super_admin";
  
  const isStockActive = activeItem.startsWith("/estoque");
  const isMarketingActive = activeItem.startsWith("/marketing");

  const handleNavClick = (href: string) => {
    onNavigate(href);
    onOpenChange(false);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.href;

    return (
      <button
        key={item.href}
        onClick={() => handleNavClick(item.href)}
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
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="h-16 flex flex-row items-center border-b border-sidebar-border px-4">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <img
            src="/logo-printmycase.png"
            alt="Print My Case"
            className="h-10 object-contain"
          />
        </SheetHeader>

        <div className="flex-1 flex flex-col">
          <nav className="flex-1 py-4 px-2 space-y-1">
            {renderNavItem(navItems[0])}
            <CollapsibleNavMenu
              icon={Package}
              label="Estoque"
              href="/estoque"
              subItems={stockSubItems}
              collapsed={false}
              isActive={isStockActive}
              expanded={stockExpanded}
              onExpandedChange={onStockExpandedChange}
              onNavigate={handleNavClick}
              activeItem={activeItem}
              defaultSubTab="tabela"
            />
            {renderNavItem(navItems[1])}
            <CollapsibleNavMenu

              icon={Megaphone}
              label="Marketing"
              href="/marketing"
              subItems={marketingSubItems}
              collapsed={false}
              isActive={isMarketingActive}
              expanded={marketingExpanded}
              onExpandedChange={onMarketingExpandedChange}
              onNavigate={handleNavClick}
              activeItem={activeItem}
              defaultSubTab="cupons"
            />
            {renderNavItem({ icon: Wallet, label: "Financeiro", href: "/financeiro" })}
          </nav>
          
          <nav className="py-4 px-2 space-y-1 border-t border-sidebar-border">
            {bottomNavItems
              .filter(item => !item.superAdminOnly || isSuperAdmin)
              .map(renderNavItem)}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
