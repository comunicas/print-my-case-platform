import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeItem: string;
  onNavigate: (href: string) => void;
}

export function AppSidebar({ collapsed, onToggle, activeItem, onNavigate }: AppSidebarProps) {
  const isReportsActive = activeItem.startsWith("/reports");
  const [reportsOpen, setReportsOpen] = useState(isReportsActive);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.href;

    const button = (
      <button
        onClick={() => onNavigate(item.href)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          collapsed && "justify-center px-2",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{button}</div>;
  };

  const renderReportsMenu = () => {
    if (collapsed) {
      const button = (
        <button
          onClick={() => onNavigate("/reports")}
          className={cn(
            "w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isReportsActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <BarChart3 className="h-5 w-5 flex-shrink-0" />
        </button>
      );

      return (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Relatórios
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Collapsible open={reportsOpen} onOpenChange={setReportsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
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
              const isSubActive = activeItem === subItem.href || 
                (activeItem.startsWith("/reports") && activeItem.includes(subItem.href.split("=")[1]));
              
              return (
                <button
                  key={subItem.href}
                  onClick={() => onNavigate(subItem.href)}
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
          "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 flex-shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center border-b border-sidebar-border px-4">
          {collapsed ? (
            <img
              src="/icon-printmycase.png"
              alt="Print My Case"
              className="h-8 w-8 object-contain"
            />
          ) : (
            <img
              src="/logo-printmycase.png"
              alt="Print My Case"
              className="h-10 object-contain"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {renderNavItem(navItems[0])}
          {renderReportsMenu()}
          {renderNavItem(navItems[1])}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Recolher</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
