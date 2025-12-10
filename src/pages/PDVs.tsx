import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MapPin, TrendingUp, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PDV {
  id: string;
  name: string;
  location: string;
  status: "active" | "inactive";
  machineId: string;
  revenue: string;
  transactions: number;
}

const mockPDVs: PDV[] = [
  {
    id: "1",
    name: "Shopping Ibirapuera",
    location: "São Paulo - SP",
    status: "active",
    machineId: "PMC-001",
    revenue: "R$ 12.450",
    transactions: 342,
  },
  {
    id: "2",
    name: "Shopping Morumbi",
    location: "São Paulo - SP",
    status: "active",
    machineId: "PMC-002",
    revenue: "R$ 9.230",
    transactions: 256,
  },
  {
    id: "3",
    name: "Shopping Center Norte",
    location: "São Paulo - SP",
    status: "inactive",
    machineId: "PMC-003",
    revenue: "R$ 0",
    transactions: 0,
  },
  {
    id: "4",
    name: "Shopping Eldorado",
    location: "São Paulo - SP",
    status: "active",
    machineId: "PMC-004",
    revenue: "R$ 15.780",
    transactions: 428,
  },
  {
    id: "5",
    name: "Shopping Pátio Paulista",
    location: "São Paulo - SP",
    status: "active",
    machineId: "PMC-005",
    revenue: "R$ 7.650",
    transactions: 198,
  },
  {
    id: "6",
    name: "Shopping Aricanduva",
    location: "São Paulo - SP",
    status: "active",
    machineId: "PMC-006",
    revenue: "R$ 5.320",
    transactions: 145,
  },
];

export default function PDVs() {
  const [pdvs, setPdvs] = useState<PDV[]>(mockPDVs);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPdv, setEditingPdv] = useState<PDV | null>(null);
  const [deletingPdv, setDeletingPdv] = useState<PDV | null>(null);
  const [newPdv, setNewPdv] = useState({
    name: "",
    location: "",
    machineId: "",
    status: "active" as "active" | "inactive",
  });
  const { toast } = useToast();

  const filteredPdvs = pdvs.filter(
    (pdv) =>
      pdv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdv.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdv.machineId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePdv = () => {
    if (!newPdv.name || !newPdv.location || !newPdv.machineId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const pdv: PDV = {
      id: String(pdvs.length + 1),
      name: newPdv.name,
      location: newPdv.location,
      machineId: newPdv.machineId,
      status: newPdv.status,
      revenue: "R$ 0",
      transactions: 0,
    };

    setPdvs([...pdvs, pdv]);
    setNewPdv({ name: "", location: "", machineId: "", status: "active" });
    setIsCreateDialogOpen(false);

    toast({
      title: "PDV criado",
      description: `${pdv.name} foi adicionado com sucesso.`,
    });
  };

  const handleOpenEdit = (pdv: PDV) => {
    setEditingPdv({ ...pdv });
    setIsEditDialogOpen(true);
  };

  const handleEditPdv = () => {
    if (!editingPdv) return;

    if (!editingPdv.name || !editingPdv.location || !editingPdv.machineId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setPdvs(pdvs.map((p) => (p.id === editingPdv.id ? editingPdv : p)));
    setIsEditDialogOpen(false);
    setEditingPdv(null);

    toast({
      title: "PDV atualizado",
      description: `${editingPdv.name} foi atualizado com sucesso.`,
    });
  };

  const handleOpenDelete = (pdv: PDV) => {
    setDeletingPdv(pdv);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePdv = () => {
    if (!deletingPdv) return;

    setPdvs(pdvs.filter((p) => p.id !== deletingPdv.id));
    setIsDeleteDialogOpen(false);

    toast({
      title: "PDV excluído",
      description: `${deletingPdv.name} foi removido.`,
    });

    setDeletingPdv(null);
  };

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              Pontos de Venda
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Gerencie suas máquinas e localizações
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar PDV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Ponto de Venda</DialogTitle>
                <DialogDescription>
                  Adicione um novo PDV para sua organização.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do PDV *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Shopping Ibirapuera"
                    value={newPdv.name}
                    onChange={(e) =>
                      setNewPdv({ ...newPdv, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Localização *</Label>
                  <Input
                    id="location"
                    placeholder="Ex: São Paulo - SP"
                    value={newPdv.location}
                    onChange={(e) =>
                      setNewPdv({ ...newPdv, location: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machineId">ID da Máquina *</Label>
                  <Input
                    id="machineId"
                    placeholder="Ex: PMC-007"
                    value={newPdv.machineId}
                    onChange={(e) =>
                      setNewPdv({ ...newPdv, machineId: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newPdv.status}
                    onValueChange={(value: "active" | "inactive") =>
                      setNewPdv({ ...newPdv, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreatePdv}>Criar PDV</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, localização ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* PDV Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredPdvs.map((pdv) => (
            <Card key={pdv.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base md:text-lg font-semibold truncate">
                      {pdv.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{pdv.location}</span>
                    </div>
                  </div>
                  <Badge
                    variant={pdv.status === "active" ? "default" : "secondary"}
                    className="ml-2 flex-shrink-0"
                  >
                    {pdv.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">ID Máquina</span>
                    <span className="font-medium">{pdv.machineId}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Faturamento</span>
                    <span className="font-semibold text-primary flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {pdv.revenue}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Transações</span>
                    <span className="font-medium">{pdv.transactions}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEdit(pdv)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleOpenDelete(pdv)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPdvs.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              Nenhum PDV encontrado
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Tente ajustar sua busca."
                : "Adicione seu primeiro ponto de venda."}
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Ponto de Venda</DialogTitle>
            <DialogDescription>
              Atualize as informações do PDV.
            </DialogDescription>
          </DialogHeader>
          {editingPdv && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome do PDV *</Label>
                <Input
                  id="edit-name"
                  value={editingPdv.name}
                  onChange={(e) =>
                    setEditingPdv({ ...editingPdv, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Localização *</Label>
                <Input
                  id="edit-location"
                  value={editingPdv.location}
                  onChange={(e) =>
                    setEditingPdv({ ...editingPdv, location: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-machineId">ID da Máquina *</Label>
                <Input
                  id="edit-machineId"
                  value={editingPdv.machineId}
                  onChange={(e) =>
                    setEditingPdv({ ...editingPdv, machineId: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingPdv.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setEditingPdv({ ...editingPdv, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditPdv}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir PDV</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingPdv?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePdv}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
