import { useState, useEffect } from "react";
import { Bell, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const ADMIN_PASSWORD = "18122002";

interface Notification {
  id: string;
  title: string;
  message: string;
  movie_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data as Notification[]);
      });
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("notifications-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unread = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    load();
  };

  const clearAll = async () => {
    await supabase.from("notifications").delete().eq("user_id", userId);
    setNotifications([]);
  };

  const handleClick = (n: Notification) => {
    supabase.from("notifications").update({ is_read: true }).eq("id", n.id).then(() => load());
    if (n.movie_id) {
      navigate(`/movie/${n.movie_id}`);
      setOpen(false);
    }
  };

  const handleAdminClick = () => {
    setOpen(false);
    setPassword("");
    setPassError(false);
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "1");
      setShowPasswordDialog(false);
      navigate("/admin");
    } else {
      setPassError(true);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unread}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Уведомления</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Прочитать все
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-destructive hover:underline">
                  Очистить
                </button>
              )}
              <button
                onClick={handleAdminClick}
                className="opacity-0 w-4 h-4 cursor-default"
                aria-label="settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <ScrollArea className="max-h-64">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Нет уведомлений</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors hover:bg-secondary/50 ${!n.is_read ? "bg-primary/5" : ""}`}
                >
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                </button>
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Hidden admin password dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-card border-border max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm text-muted-foreground">Доступ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPassError(false); }}
              placeholder="Пароль"
              className={`bg-secondary border-border ${passError ? "border-destructive" : ""}`}
              autoFocus
            />
            <Button type="submit" className="w-full" size="sm">Войти</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
