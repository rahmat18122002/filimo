import { useState, useEffect } from "react";
import { ImageIcon, CheckCircle, XCircle, Clock, User, Trash2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Topup {
  id: string;
  user_id: string;
  amount: number;
  approved_amount: number | null;
  screenshot_url: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_balance?: number;
}

const TopupsAdmin = () => {
  const [topups, setTopups] = useState<Topup[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [monthly, setMonthly] = useState<number>(0);

  const load = async () => {
    const { data } = await supabase.from("balance_topups").select("*").order("created_at", { ascending: false });
    if (!data) return;
    const ids = [...new Set(data.map((t: any) => t.user_id))];
    const { data: users } = await supabase.from("app_users").select("id, display_name, balance").in("id", ids);
    const map = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
    setTopups(
      data.map((t: any) => ({
        ...t,
        user_name: map[t.user_id]?.display_name || "Неизвестный",
        user_balance: map[t.user_id]?.balance ?? 0,
      }))
    );
  };

  useEffect(() => {
    load();
    supabase
      .from("vip_plans")
      .select("price, months")
      .eq("is_active", true)
      .eq("months", 1)
      .order("price")
      .limit(1)
      .then(({ data }) => {
        if (data && data[0]) setMonthly(data[0].price);
      });
  }, []);

  const approve = async (t: Topup) => {
    const sum = parseInt(amounts[t.id] ?? String(t.amount), 10);
    if (!sum || sum <= 0) return toast({ title: "Укажите подтверждённую сумму", variant: "destructive" });

    const { data: u } = await supabase.from("app_users").select("*").eq("id", t.user_id).single();
    if (!u) return toast({ title: "Пользователь не найден", variant: "destructive" });

    let credit = sum;
    const update: Record<string, unknown> = {};

    // Списываем абонплату за месяц, остаток — на баланс
    if (monthly > 0 && credit >= monthly) {
      credit -= monthly;
      const base = u.vip_until && new Date(u.vip_until) > new Date() ? new Date(u.vip_until).getTime() : Date.now();
      update.is_vip = true;
      update.vip_until = new Date(base + 30 * 24 * 3600 * 1000).toISOString();
    }
    update.balance = (u.balance ?? 0) + credit;

    const { error: uErr } = await supabase.from("app_users").update(update).eq("id", t.user_id);
    if (uErr) return toast({ title: "Ошибка начисления", variant: "destructive" });

    await supabase
      .from("balance_topups")
      .update({ status: "approved", approved_amount: sum, reviewed_at: new Date().toISOString() })
      .eq("id", t.id);

    toast({
      title: "Пополнение принято",
      description: monthly > 0 && sum >= monthly ? `Списана абонплата ${monthly}₽, на баланс: ${credit}₽` : `На баланс: ${credit}₽`,
    });
    load();
  };

  const reject = async (t: Topup) => {
    await supabase.from("balance_topups").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", t.id);
    toast({ title: "Чек отклонён" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("balance_topups").delete().eq("id", id);
    toast({ title: "Удалено", variant: "destructive" });
    load();
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-400/30"><CheckCircle className="h-3 w-3" /> Принят</Badge>;
    if (s === "rejected") return <Badge variant="outline" className="gap-1 text-destructive border-destructive/30"><XCircle className="h-3 w-3" /> Отклонён</Badge>;
    return <Badge variant="outline" className="gap-1 text-amber-400 border-amber-400/30"><Clock className="h-3 w-3" /> Ожидает</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Пополнения баланса
        </h2>
        <span className="text-sm text-muted-foreground">Абонплата за месяц: {monthly || "—"}₽</span>
      </div>

      <div className="space-y-3">
        {topups.map((t) => (
          <Card key={t.id} className="bg-gradient-card border-border">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{t.user_name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Wallet className="h-3 w-3" /> {t.user_balance}₽
                  </span>
                </div>
                {statusBadge(t.status)}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Заявлено: {t.amount}₽</span>
                {t.approved_amount != null && <span>Принято: {t.approved_amount}₽</span>}
                <span>{new Date(t.created_at).toLocaleString("ru")}</span>
              </div>

              <div
                className="w-full max-w-xs cursor-pointer overflow-hidden rounded-lg border border-border"
                onClick={() => setPreviewUrl(t.screenshot_url)}
              >
                <img src={t.screenshot_url} alt="Чек" className="w-full object-cover" style={{ maxHeight: 200 }} />
              </div>

              {t.status === "pending" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    className="w-32"
                    placeholder={`${t.amount}`}
                    value={amounts[t.id] ?? ""}
                    onChange={(e) => setAmounts({ ...amounts, [t.id]: e.target.value })}
                  />
                  <Button size="sm" className="gap-1" onClick={() => approve(t)}>
                    <CheckCircle className="h-4 w-4" /> Принять
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => reject(t)}>
                    <XCircle className="h-4 w-4" /> Отклонить
                  </Button>
                </div>
              )}

              <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => remove(t.id)}>
                <Trash2 className="h-4 w-4" /> Удалить
              </Button>
            </CardContent>
          </Card>
        ))}
        {topups.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">Пополнений пока нет</p>}
      </div>

      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-lg border-border bg-card p-2">
          {previewUrl && <img src={previewUrl} alt="Чек" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopupsAdmin;
