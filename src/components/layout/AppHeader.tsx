import { Bell, ChevronDown, Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Mock data - will be replaced with real auth context
const mockUser = {
  name: "João Silva",
  email: "joao@printmycase.com",
  role: "org_admin" as "org_admin" | "pdv_manager" | "super_admin",
  organization: "Print My Case SP",
  avatar: "",
};

const mockPDVs = [
  { id: "1", name: "Shopping Ibirapuera" },
  { id: "2", name: "Shopping Morumbi" },
  { id: "3", name: "Shopping Eldorado" },
];

interface AppHeaderProps {
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export function AppHeader({ isMobile, onMenuClick }: AppHeaderProps) {
  const initials = mockUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-3 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {/* Hamburger Menu - Mobile Only */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Organization/PDV Context */}
        {mockUser.role === "pdv_manager" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-sm md:text-base min-w-0">
                <span className="truncate max-w-[120px] md:max-w-none">{mockPDVs[0].name}</span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {mockPDVs.map((pdv) => (
                <DropdownMenuItem key={pdv.id}>{pdv.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="min-w-0">
            <h2 className="font-semibold text-sm md:text-base truncate max-w-[150px] md:max-w-none text-foreground">
              {mockUser.organization}
            </h2>
            <p className="text-xs text-muted-foreground hidden md:block">
              {mockUser.role === "org_admin" ? "Administrador" : "Super Admin"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-1 md:px-2">
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarImage src={mockUser.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-[100px] lg:max-w-none">
                  {mockUser.name}
                </p>
                <p className="text-xs text-muted-foreground">{mockUser.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 hidden md:inline text-muted-foreground flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
