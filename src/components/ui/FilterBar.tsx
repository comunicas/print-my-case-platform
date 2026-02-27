import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  children: ReactNode;
  onClear?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({ children, onClear, hasActiveFilters, className }: FilterBarProps) {
  return (
    <div className={`flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center ${className ?? ""}`}>
      {children}
      {hasActiveFilters && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear} className="w-full sm:w-auto" data-testid="clear-filters">
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
