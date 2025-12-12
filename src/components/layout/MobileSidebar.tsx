import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
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

const reportSubItems = [
  { label: "Vendas por Unidade", href: "/reports?tab=unit" },
  { label: "Vendas Mensal", href: "/reports?tab=monthly" },
  { label: "Análise de Produtos", href: "/reports?tab=products" },
  { label: "Saúde do Estoque", href: "/reports?tab=stock" },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItem: string;
  onNavigate: (href: string) => void;
}

const STORAGE_KEY = 'sidebar-reports-expanded';

export function MobileSidebar({ open, onOpenChange, activeItem, onNavigate }: MobileSidebarProps) {
  const isReportsActive = activeItem.startsWith("/reports");
  const [reportsOpen, setReportsOpen] = useState(() => {
    if (isReportsActive) return true;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(reportsOpen));
  }, [reportsOpen]);

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

  const renderReportsMenu = () => {
    return (
      <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
              isReportsActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <BarChart3 className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">Relatórios</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                reportsOpen && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 mt-1 space-y-1">
            {reportSubItems.map((subItem) => {
              const activeTab = activeItem.startsWith("/reports")
                ? new URLSearchParams(activeItem.split("?")[1]).get("tab") || "unit"
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
          {renderReportsMenu()}
          {renderNavItem(navItems[1])}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
