import { useState, useEffect } from 'react';
import { Loader2, Settings2, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePreferences } from '@/hooks/usePreferences';
import { cn } from '@/lib/utils';

interface PDV {
  id: string;
  name: string;
}

interface PDVFilterProps {
  value: string;
  onChange: (value: string) => void;
  pdvs: PDV[];
  showAutoAppliedBadge?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function PDVFilter({
  value,
  onChange,
  pdvs,
  showAutoAppliedBadge = false,
  className,
  triggerClassName,
}: PDVFilterProps) {
  const { preferences, updatePreferences } = usePreferences();

  // Auto-select when only one PDV exists
  useEffect(() => {
    if (pdvs.length === 1 && value !== pdvs[0].id) {
      onChange(pdvs[0].id);
    }
  }, [pdvs, value, onChange]);

  // Animation state for the Auto badge
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [shouldShowBadge, setShouldShowBadge] = useState(showAutoAppliedBadge);

  useEffect(() => {
    if (showAutoAppliedBadge && !shouldShowBadge) {
      setShouldShowBadge(true);
      setIsAnimatingOut(false);
    } else if (!showAutoAppliedBadge && shouldShowBadge && !isAnimatingOut) {
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldShowBadge(false);
        setIsAnimatingOut(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showAutoAppliedBadge, shouldShowBadge, isAnimatingOut]);

  // When single PDV, show only static text
  if (pdvs.length <= 1) {
    if (pdvs.length === 0) return null;
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <span className="text-sm text-muted-foreground px-3 py-2">{pdvs[0].name}</span>
      </div>
    );
  }

  const isCurrentDefault = value !== 'all' && value === preferences?.default_pdv;
  const canSaveAsDefault = value !== 'all' && value !== preferences?.default_pdv;

  const handleSaveAsDefault = () => {
    updatePreferences.mutate({ default_pdv: value });
  };

  const handleClearDefault = () => {
    updatePreferences.mutate({ default_pdv: null });
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="relative">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger 
            data-testid="pdv-select-trigger"
            className={cn("w-full sm:w-[180px] transition-all duration-200", triggerClassName)}
          >
            <SelectValue placeholder="Selecionar PDV" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os PDVs</SelectItem>
            {pdvs.map((pdv) => (
              <SelectItem key={pdv.id} value={pdv.id}>
                {pdv.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {shouldShowBadge && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline"
                  data-testid="auto-badge"
                  className={cn(
                    "absolute -top-2 -right-2 text-[10px] px-1.5 py-0 h-4 bg-primary/10 border-primary/30 text-primary cursor-help",
                    isAnimatingOut ? "animate-badge-fade-out" : "animate-badge-fade-in"
                  )}
                >
                  <Settings2 className="h-2.5 w-2.5 mr-0.5" />
                  Auto
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filtro aplicado das suas preferências</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Save as default button */}
      {canSaveAsDefault && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="save-default-pdv"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={handleSaveAsDefault}
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Salvar como PDV padrão</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Clear default button */}
      {isCurrentDefault && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="clear-default-pdv"
                className="h-8 w-8 text-primary hover:text-destructive"
                onClick={handleClearDefault}
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remover PDV padrão</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
