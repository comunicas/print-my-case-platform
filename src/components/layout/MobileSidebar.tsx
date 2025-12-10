import {
  LayoutDashboard,
  MapPin,
  Users,
  Upload,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: MapPin, label: "PDVs", href: "/pdvs" },
  { icon: Users, label: "Equipe", href: "/team", roles: ["org_admin", "super_admin"] },
  { icon: Upload, label: "Upload", href: "/upload" },
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeItem: string;
  onNavigate: (href: string) => void;
}

export function MobileSidebar({ open, onOpenChange, activeItem, onNavigate }: MobileSidebarProps) {
  const handleNavClick = (href: string) => {
    onNavigate(href);
    onOpenChange(false);
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
          {navItems.map((item) => {
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
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
