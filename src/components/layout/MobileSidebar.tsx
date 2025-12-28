import {
  LayoutDashboard,
  Upload,
  Package,
  X,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Upload, label: "Uploads", href: "/uploads" },
];

const stockSubItems = [
  { label: "Tabela", href: "/reports?tab=tabela" },
  { label: "Mapa", href: "/reports?tab=mapa" },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItem: string;
  onNavigate: (href: string) => void;
  stockExpanded: boolean;
  onStockExpandedChange: (expanded: boolean) => void;
}

export function MobileSidebar({ 
  open, 
  onOpenChange, 
  activeItem, 
  onNavigate,
  stockExpanded,
  onStockExpandedChange,
}: MobileSidebarProps) {
  const isStockActive = activeItem.startsWith("/reports");

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
          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
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

  const renderStockMenu = () => {
    // Auto-expand when navigating to stock
    const effectiveStockExpanded = isStockActive || stockExpanded;

    return (
      <Collapsible open={effectiveStockExpanded} onOpenChange={onStockExpandedChange}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
              isStockActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <Package className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">Estoque</span>
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
              const activeTab = activeItem.startsWith("/reports")
                ? new URLSearchParams(activeItem.split("?")[1]).get("tab") || "tabela"
                : null;
              const subItemTab = subItem.href.split("=")[1];
              const isSubActive = activeTab === subItemTab;
              
              return (
                <button
                  key={subItem.href}
                  onClick={() => handleNavClick(subItem.href)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors",
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
        <SheetHeader className="h-16 flex flex-row items-center justify-between border-b border-sidebar-border px-4">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <img
            src="/logo-printmycase.png"
            alt="Print My Case"
            className="h-10 object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {renderNavItem(navItems[0])}
          {renderStockMenu()}
          {renderNavItem(navItems[1])}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
