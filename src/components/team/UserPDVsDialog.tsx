import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { useUserPDVs } from "@/hooks/useUserPDVs";
import { usePDVs } from "@/hooks/usePDVs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserPDVsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

export function UserPDVsDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: UserPDVsDialogProps) {
  const { pdvs, isLoading: isLoadingPDVs } = usePDVs();
  const { userPDVs, isLoading: isLoadingUserPDVs, bulkUpdatePDVs } = useUserPDVs(userId);
  const [selectedPDVs, setSelectedPDVs] = useState<string[]>([]);

  // Inicializar seleções quando os dados carregarem
  useEffect(() => {
    if (userPDVs && open) {
      setSelectedPDVs(userPDVs.map((up) => up.pdv_id));
    }
  }, [userPDVs, open]);

  const isLoading = isLoadingPDVs || isLoadingUserPDVs;

  const handleTogglePDV = (pdvId: string) => {
    setSelectedPDVs((prev) =>
      prev.includes(pdvId)
        ? prev.filter((id) => id !== pdvId)
        : [...prev, pdvId]
    );
  };

  const handleSelectAll = () => {
    if (pdvs) {
      setSelectedPDVs(pdvs.map((pdv) => pdv.id));
    }
  };

  const handleClearAll = () => {
    setSelectedPDVs([]);
  };

  const handleSave = async () => {
    await bulkUpdatePDVs.mutateAsync({
      userId,
      pdvIds: selectedPDVs,
    });
    onOpenChange(false);
  };

  const hasChanges = () => {
    const currentPDVIds = userPDVs.map((up) => up.pdv_id).sort();
    const newPDVIds = [...selectedPDVs].sort();
    return JSON.stringify(currentPDVIds) !== JSON.stringify(newPDVIds);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gerenciar PDVs</DialogTitle>
          <DialogDescription>
            Selecione os PDVs que <strong>{userName}</strong> pode acessar.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pdvs && pdvs.length > 0 ? (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={selectedPDVs.length === pdvs.length}
              >
                Selecionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedPDVs.length === 0}
              >
                Limpar Seleção
              </Button>
            </div>

            {/* PDV List */}
            <ScrollArea className="h-[250px] rounded-md border p-3">
              <div className="space-y-3">
                {pdvs.map((pdv) => (
                  <div
                    key={pdv.id}
                    className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`pdv-${pdv.id}`}
                      checked={selectedPDVs.includes(pdv.id)}
                      onCheckedChange={() => handleTogglePDV(pdv.id)}
                    />
                    <Label
                      htmlFor={`pdv-${pdv.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-sm">{pdv.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {pdv.location}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Warning when no PDVs selected */}
            {selectedPDVs.length === 0 && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sem PDVs selecionados, o usuário terá acesso a todos os PDVs da organização.
                </AlertDescription>
              </Alert>
            )}

            {/* Selection Count */}
            <p className="text-xs text-muted-foreground">
              {selectedPDVs.length} de {pdvs.length} PDV(s) selecionado(s)
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum PDV cadastrado</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || bulkUpdatePDVs.isPending}
          >
            {bulkUpdatePDVs.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
