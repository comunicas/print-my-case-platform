import { ChevronDown, Menu, User, LogOut, Sun, Moon, Settings } from "lucide-react";
import { NotificationsPopover } from "./NotificationsPopover";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { OrgSwitcher } from "./OrgSwitcher";

interface AppHeaderProps {
  isMobile?: boolean;
  onMenuClick?: () => void;
}

export function AppHeader({ isMobile, onMenuClick }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { profile, role } = useProfile();
  const { activeOrgName, hasMultipleOrgs } = useActiveOrg();
  const navigate = useNavigate();
  
  const initials = profile?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    org_admin: "Administrador",
    operator: "Operador",
    viewer: "Visualizador",
  };

  return (
    <header className="h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-3 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {isMobile && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="flex-shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {hasMultipleOrgs ? (
          <OrgSwitcher />
        ) : (
          <div className="min-w-0">
            <h2 className="font-semibold text-sm md:text-base truncate max-w-[150px] md:max-w-none text-foreground">
              {activeOrgName || "Carregando..."}
            </h2>
            <p className="text-xs text-muted-foreground hidden md:block">
              {role ? roleLabels[role] : "Carregando..."}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative"
        >
          <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-muted-foreground" />
          <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-muted-foreground" />
        </Button>

        <NotificationsPopover />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-1 md:px-2">
              <Avatar className="h-7 w-7 md:h-8 md:w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-[100px] lg:max-w-none">
                  {profile?.name || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 hidden md:inline text-muted-foreground flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/settings?tab=profile")}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
