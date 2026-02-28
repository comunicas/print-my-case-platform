import { Bell, ShoppingBag, FileCheck, AlertTriangle, UserPlus, Check, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";

const typeConfig: Record<
  Notification["type"],
  { icon: typeof Bell; className: string; route: string }
> = {
  product_request: {
    icon: ShoppingBag,
    className: "text-blue-500 bg-blue-500/10",
    route: "/marketing?tab=pedidos",
  },
  upload_processed: {
    icon: FileCheck,
    className: "text-green-500 bg-green-500/10",
    route: "/uploads",
  },
  stock_alert: {
    icon: AlertTriangle,
    className: "text-yellow-500 bg-yellow-500/10",
    route: "/estoque",
  },
  team_member: {
    icon: UserPlus,
    className: "text-purple-500 bg-purple-500/10",
    route: "/settings?tab=equipe",
  },
};

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
  isAdmin,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onNavigate: () => void;
  isAdmin: boolean;
}) {
  const config = typeConfig[notification.type] || typeConfig.product_request;
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors rounded-md group",
        !notification.is_read && "bg-accent/30"
      )}
      onClick={() => {
        if (!notification.is_read) {
          onMarkAsRead();
        }
        onNavigate();
      }}
    >
      <div className={cn("p-2 rounded-full flex-shrink-0", config.className)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium truncate", !notification.is_read && "text-foreground")}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>

      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}

export function NotificationsPopover() {
  const navigate = useNavigate();
  const { role } = useProfile();
  const isAdmin = role === "super_admin" || role === "org_admin";
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNavigate = (notification: Notification) => {
    const config = typeConfig[notification.type];
    if (config?.route) {
      // If metadata has specific ID, use it
      if (notification.type === "upload_processed" && notification.metadata?.upload_id) {
        navigate(`/uploads/${notification.metadata.upload_id}`);
      } else {
        navigate(config.route);
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 md:h-5 md:w-5 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[10px] md:text-xs font-medium text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 md:w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              <Check className="h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px] md:h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Você receberá notificações sobre novos pedidos, uploads e alertas
              </p>
            </div>
          ) : (
            <div className="p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead.mutate(notification.id)}
                  onDelete={() => deleteNotification.mutate(notification.id)}
                  onNavigate={() => handleNavigate(notification)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => navigate("/settings?tab=notificacoes")}
              >
                Gerenciar preferências de notificação
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
