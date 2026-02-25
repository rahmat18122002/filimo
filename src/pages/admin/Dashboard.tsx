import { useState, useEffect } from "react";
import { Film, Users, Crown, TrendingUp, DollarSign, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [movieCount, setMovieCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [vipCount, setVipCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("movies").select("id", { count: "exact", head: true }).then(({ count }) => setMovieCount(count || 0));
    supabase.from("app_users").select("id", { count: "exact", head: true }).then(({ count }) => setUserCount(count || 0));
    supabase.from("app_users").select("id", { count: "exact", head: true }).eq("is_vip", true).then(({ count }) => setVipCount(count || 0));
    supabase.from("app_users").select("*").order("created_at", { ascending: false }).limit(5).then(({ data }) => {
      if (data) setRecentUsers(data);
    });
  }, []);

  const stats = [
    { label: "Всего фильмов", value: movieCount, icon: Film, color: "text-primary" },
    { label: "Пользователей", value: userCount, icon: Users, color: "text-blue-400" },
    { label: "VIP подписчиков", value: vipCount, icon: Crown, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Дашборд
      </h2>

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

      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Последние регистрации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.display_name || "Без имени"}</p>
                  <p className="text-xs text-muted-foreground">{u.device_id.slice(0, 12)}...</p>
                </div>
                <div className="flex items-center gap-3">
                  {u.is_vip && (
                    <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      <Crown className="h-3 w-3" /> VIP
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("ru")}
                  </span>
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
