import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SubItem {
  label: string;
  href: string;
}

interface CollapsibleNavMenuProps {
  icon: React.ElementType;
  label: string;
  href: string;
  subItems: SubItem[];
  collapsed: boolean;
  isActive: boolean;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onNavigate: (href: string) => void;
  onPrefetch?: () => void;
  activeItem: string;
  defaultSubTab: string;
}

export function CollapsibleNavMenu({
  icon: Icon,
  label,
  href,
  subItems,
  collapsed,
  isActive,
  expanded,
  onExpandedChange,
  onNavigate,
  onPrefetch,
  activeItem,
  defaultSubTab,
}: CollapsibleNavMenuProps) {
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onNavigate(href)}
            onMouseEnter={onPrefetch}
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
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  const effectiveExpanded = isActive || expanded;

  return (
    <Collapsible open={effectiveExpanded} onOpenChange={onExpandedChange}>
      <CollapsibleTrigger asChild>
        <button
          onMouseEnter={onPrefetch}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              effectiveExpanded && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 mt-1 space-y-1">
          {subItems.map((subItem) => {
            let isSubActive = false;

            if (subItem.href.includes('?')) {
              // Query-based matching (Marketing)
              const activeTab = activeItem.startsWith(href)
                ? new URLSearchParams(activeItem.split("?")[1]).get("tab") || defaultSubTab
                : null;
              const subItemTab = subItem.href.split("=")[1];
              isSubActive = activeTab === subItemTab;
            } else {
              // Path-based matching (Estoque)
              const activePath = activeItem.split("?")[0];
              isSubActive = activePath === subItem.href;
            }

            return (
              <button
                key={subItem.href}
                onClick={() => onNavigate(subItem.href)}
                onMouseEnter={onPrefetch}
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
}
