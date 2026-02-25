import { Crown, DollarSign, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const VipAdmin = () => {
  const [vipCount, setVipCount] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    supabase.from("app_users").select("id", { count: "exact", head: true }).eq("is_vip", true).then(({ count }) => setVipCount(count || 0));
    supabase.from("app_users").select("id", { count: "exact", head: true }).then(({ count }) => setTotalUsers(count || 0));
  }, []);

  const stats = [
    { label: "VIP подписчиков", value: vipCount, icon: Crown, color: "text-accent" },
    { label: "Всего пользователей", value: totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Конверсия", value: totalUsers > 0 ? `${((vipCount / totalUsers) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        VIP-подписки
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="bg-gradient-card border-border">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg bg-secondary p-3 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="flex items-start gap-4 p-5">
          <DollarSign className="mt-0.5 h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="font-medium text-foreground">Интеграция Stripe</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Для автоматического приёма оплат за VIP-подписки подключите Stripe через настройки проекта.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VipAdmin;
