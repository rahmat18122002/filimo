import { useState, useEffect } from "react";
import { Crown, Search, Ban, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppUser {
  id: string;
  device_id: string;
  display_name: string | null;
  is_vip: boolean;
  vip_until: string | null;
  created_at: string;
}

const UsersAdmin = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");

  const loadUsers = () => {
    supabase.from("app_users").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setUsers(data as AppUser[]);
    });
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((u) =>
    (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
    u.device_id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVip = async (u: AppUser) => {
    await supabase.from("app_users").update({ is_vip: !u.is_vip }).eq("id", u.id);
    toast({ title: u.is_vip ? "VIP снят" : "VIP назначен" });
    loadUsers();
  };

  const deleteUser = async (id: string) => {
    await supabase.from("app_users").delete().eq("id", id);
    toast({ title: "Пользователь удалён", variant: "destructive" });
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Управление пользователями
      </h2>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="pl-9 bg-secondary border-border" />
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} из {users.length}</div>
      </div>

      <Card className="bg-gradient-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Имя</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Device ID</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Статус</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Дата</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{u.display_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell font-mono text-xs">{u.device_id.slice(0, 12)}...</td>
                    <td className="px-4 py-3">
                      {u.is_vip ? (
                        <Badge className="bg-accent/20 text-accent border-accent/30"><Crown className="mr-1 h-3 w-3" />VIP</Badge>
                      ) : (
                        <Badge variant="secondary">Обычный</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(u.created_at).toLocaleDateString("ru")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => toggleVip(u)} className="gap-2">
                            <Crown className="h-4 w-4" />
                            {u.is_vip ? "Снять VIP" : "Назначить VIP"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteUser(u.id)} className="gap-2 text-destructive focus:text-destructive">
                            <Ban className="h-4 w-4" />
                            Удалить / Заблокировать
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersAdmin;
