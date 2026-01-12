import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ['↑', '↓', '←', '→'], description: 'Navegar entre slots' },
  { keys: ['Enter', 'Espaço'], description: 'Abrir detalhes' },
  { keys: ['C'], description: 'Modo compacto' },
  { keys: ['E'], description: 'Modo expandido' },
  { keys: ['F'], description: 'Tela cheia' },
  { keys: ['Esc'], description: 'Fechar / Sair' },
  { keys: ['?'], description: 'Esta ajuda' },
];

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="Atalhos de teclado (?)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h4 className="font-semibold text-sm">Atalhos de Teclado</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="p-2 space-y-1">
          {shortcuts.map((shortcut, index) => (
            <div 
              key={index}
              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
