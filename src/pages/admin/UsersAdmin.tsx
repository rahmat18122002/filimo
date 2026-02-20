import { useState } from "react";
import { Crown, Search, Shield, Ban, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "vip" | "admin";
  status: "active" | "blocked";
  joined: string;
}

const initialUsers: User[] = [
  { id: 1, name: "Иван Петров", email: "ivan@mail.ru", role: "vip", status: "active", joined: "15.01.2026" },
  { id: 2, name: "Анна Сидорова", email: "anna@gmail.com", role: "user", status: "active", joined: "20.01.2026" },
  { id: 3, name: "Олег Козлов", email: "oleg@ya.ru", role: "vip", status: "active", joined: "05.02.2026" },
  { id: 4, name: "Мария Иванова", email: "maria@mail.ru", role: "user", status: "blocked", joined: "10.02.2026" },
  { id: 5, name: "Дмитрий Волков", email: "dmitry@mail.ru", role: "admin", status: "active", joined: "01.01.2026" },
  { id: 6, name: "Елена Новикова", email: "elena@gmail.com", role: "user", status: "active", joined: "18.02.2026" },
  { id: 7, name: "Сергей Морозов", email: "sergey@ya.ru", role: "vip", status: "active", joined: "12.02.2026" },
  { id: 8, name: "Ольга Белова", email: "olga@mail.ru", role: "user", status: "active", joined: "19.02.2026" },
];

const roleBadge = (role: User["role"]) => {
  switch (role) {
    case "admin": return <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30"><Shield className="mr-1 h-3 w-3" />Админ</Badge>;
    case "vip": return <Badge className="bg-accent/20 text-accent border-accent/30"><Crown className="mr-1 h-3 w-3" />VIP</Badge>;
    default: return <Badge variant="secondary">Пользователь</Badge>;
  }
};

const UsersAdmin = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleVip = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role: u.role === "vip" ? "user" : "vip" } : u
      )
    );
    toast({ title: "Статус VIP обновлён" });
  };

  const toggleBlock = (id: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "blocked" ? "active" : "blocked" } : u
      )
    );
    toast({ title: "Статус пользователя обновлён" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Управление пользователями
      </h2>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск пользователей..."
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filtered.length} из {users.length}
        </div>
      </div>

      <Card className="bg-gradient-card border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Имя</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Роль</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Статус</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Дата рег.</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium text-foreground">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.status === "active" ? "text-green-400" : "text-destructive"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-green-400" : "bg-destructive"}`} />
                        {u.status === "active" ? "Активен" : "Заблокирован"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{u.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => toggleVip(u.id)} className="gap-2">
                            <Crown className="h-4 w-4" />
                            {u.role === "vip" ? "Снять VIP" : "Назначить VIP"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleBlock(u.id)} className="gap-2 text-destructive">
                            <Ban className="h-4 w-4" />
                            {u.status === "blocked" ? "Разблокировать" : "Заблокировать"}
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
