import { Bell, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data - será substituído por dados reais
const mockUser = {
  name: "João Silva",
  email: "joao@printmycase.com",
  role: "org_admin",
  organization: "Print My Case SP",
};

const mockPDVs = [
  { id: "1", name: "Shopping Ibirapuera" },
  { id: "2", name: "Shopping Morumbi" },
  { id: "3", name: "Shopping Eldorado" },
];

export function AppHeader() {
  const showPDVSelector = mockUser.role === "pdv_manager";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Left Section - Organization / PDV Selector */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {mockUser.organization}
          </h2>
          <p className="text-xs text-muted-foreground">
            {mockUser.role === "org_admin" ? "Administrador" : "Gerente de PDV"}
          </p>
        </div>

        {/* PDV Selector - Apenas para PDV Managers */}
        {showPDVSelector && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span>Shopping Ibirapuera</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {mockPDVs.map((pdv) => (
                <DropdownMenuItem key={pdv.id}>{pdv.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right Section - Notifications & User */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {mockUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {mockUser.name}
                </p>
                <p className="text-xs text-muted-foreground">{mockUser.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
