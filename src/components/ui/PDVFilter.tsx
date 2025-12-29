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

  // Animation state for the Auto badge
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [shouldShowBadge, setShouldShowBadge] = useState(showAutoAppliedBadge);

  useEffect(() => {
    if (showAutoAppliedBadge && !shouldShowBadge) {
      // Badge appearing
      setShouldShowBadge(true);
      setIsAnimatingOut(false);
    } else if (!showAutoAppliedBadge && shouldShowBadge && !isAnimatingOut) {
      // Badge disappearing - start animation
      setIsAnimatingOut(true);
      const timer = setTimeout(() => {
        setShouldShowBadge(false);
        setIsAnimatingOut(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showAutoAppliedBadge, shouldShowBadge, isAnimatingOut]);

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
          <SelectTrigger className={cn("w-full sm:w-[180px]", triggerClassName)}>
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
