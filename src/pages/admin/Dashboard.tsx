import { Film, Users, Crown, TrendingUp, DollarSign, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { movies } from "@/data/movies";

const stats = [
  { label: "Всего фильмов", value: movies.length, icon: Film, color: "text-primary" },
  { label: "Пользователей", value: 1284, icon: Users, color: "text-blue-400" },
  { label: "VIP подписчиков", value: 156, icon: Crown, color: "text-accent" },
  { label: "Просмотров сегодня", value: "12.4K", icon: Eye, color: "text-green-400" },
  { label: "Доход (мес.)", value: "$4,280", icon: DollarSign, color: "text-emerald-400" },
  { label: "Рост", value: "+18%", icon: TrendingUp, color: "text-violet-400" },
];

const recentUsers = [
  { name: "Иван Петров", email: "ivan@mail.ru", vip: true, date: "Сегодня" },
  { name: "Анна Сидорова", email: "anna@gmail.com", vip: false, date: "Вчера" },
  { name: "Олег Козлов", email: "oleg@ya.ru", vip: true, date: "2 дня назад" },
  { name: "Мария Иванова", email: "maria@mail.ru", vip: false, date: "3 дня назад" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Дашборд
      </h2>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="bg-gradient-card border-border">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-secondary p-3 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent users */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Последние регистрации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.map((u) => (
              <div key={u.email} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {u.vip && (
                    <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      <Crown className="h-3 w-3" /> VIP
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{u.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
