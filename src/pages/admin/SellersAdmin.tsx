import { useEffect, useState } from "react";
import { Store, CheckCircle, XCircle, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface Seller {
  id: string;
  shop_name: string;
  description: string;
  phone: string;
  whatsapp: string;
  logo_url: string;
  is_active: boolean;
  subscription_until: string | null;
  created_at: string;
}
interface Plan { id: string; label: string; price: number; days: number; is_active: boolean }
interface Subscription {
  id: string;
  seller_id: string;
  plan_id: string;
  screenshot_url: string;
  status: string;
  created_at: string;
}

const SellersAdmin = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);

  // New plan
  const [pLabel, setPLabel] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pDays, setPDays] = useState("");

  const load = async () => {
    const [{ data: s }, { data: p }, { data: sb }] = await Promise.all([
      supabase.from("shop_sellers").select("*").order("created_at", { ascending: false }),
      supabase.from("shop_seller_plans").select("*").order("sort_order"),
      supabase.from("shop_seller_subscriptions").select("*").order("created_at", { ascending: false }),
    ]);
    if (s) setSellers(s as Seller[]);
    if (p) setPlans(p as Plan[]);
    if (sb) setSubs(sb as Subscription[]);
  };

  useEffect(() => { load(); }, []);

  const approveSub = async (sub: Subscription) => {
    const plan = plans.find(p => p.id === sub.plan_id);
    if (!plan) return;
    const seller = sellers.find(s => s.id === sub.seller_id);
    if (!seller) return;

    const baseDate = seller.subscription_until && new Date(seller.subscription_until) > new Date()
      ? new Date(seller.subscription_until)
      : new Date();
    baseDate.setDate(baseDate.getDate() + plan.days);

    await supabase.from("shop_sellers").update({
      is_active: true,
      subscription_until: baseDate.toISOString(),
    }).eq("id", sub.seller_id);

    await supabase.from("shop_seller_subscriptions").update({
      status: "confirmed",
      reviewed_at: new Date().toISOString(),
    }).eq("id", sub.id);

    toast({ title: "Подписка активирована" });
    load();
  };

  const rejectSub = async (id: string) => {
    await supabase.from("shop_seller_subscriptions").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    toast({ title: "Заявка отклонена" });
    load();
  };

  const toggleSeller = async (id: string, val: boolean) => {
    await supabase.from("shop_sellers").update({ is_active: val }).eq("id", id);
    load();
  };

  const deleteSeller = async (id: string) => {
    if (!confirm("Удалить продавца? Его товары останутся, но не будут привязаны.")) return;
    await supabase.from("shop_sellers").delete().eq("id", id);
    toast({ title: "Удалён", variant: "destructive" });
    load();
  };

  const addPlan = async () => {
    if (!pLabel.trim() || !pPrice || !pDays) return;
    await supabase.from("shop_seller_plans").insert({
      label: pLabel.trim(),
      price: parseInt(pPrice),
      days: parseInt(pDays),
    });
    setPLabel(""); setPPrice(""); setPDays("");
    load();
  };

  const togglePlan = async (id: string, val: boolean) => {
    await supabase.from("shop_seller_plans").update({ is_active: val }).eq("id", id);
    load();
  };

  const deletePlan = async (id: string) => {
    await supabase.from("shop_seller_plans").delete().eq("id", id);
    load();
  };

  const pendingSubs = subs.filter(s => s.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Store className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Продавцы</h2>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Заявки {pendingSubs.length > 0 && <Badge className="ml-2">{pendingSubs.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="sellers">Продавцы ({sellers.length})</TabsTrigger>
          <TabsTrigger value="plans">Тарифы</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3">
          {pendingSubs.map(sub => {
            const seller = sellers.find(s => s.id === sub.seller_id);
            const plan = plans.find(p => p.id === sub.plan_id);
            return (
              <Card key={sub.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
                  <a href={sub.screenshot_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    <img src={sub.screenshot_url} className="h-32 w-32 rounded object-cover" alt="payment" />
                  </a>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold">{seller?.shop_name || "—"}</p>
                    <p className="text-sm text-muted-foreground">{seller?.phone}</p>
                    <p className="text-sm">Тариф: <span className="font-medium">{plan?.label} — {plan?.price} сом ({plan?.days} дн.)</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(sub.created_at).toLocaleString("ru-RU")}</p>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={() => approveSub(sub)}><CheckCircle className="mr-1 h-4 w-4" />Подтвердить</Button>
                      <Button size="sm" variant="destructive" onClick={() => rejectSub(sub.id)}><XCircle className="mr-1 h-4 w-4" />Отклонить</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {pendingSubs.length === 0 && <p className="py-12 text-center text-muted-foreground">Нет ожидающих заявок</p>}
        </TabsContent>

        <TabsContent value="sellers" className="space-y-3">
          {sellers.map(s => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-3 p-4">
                {s.logo_url ? (
                  <img src={s.logo_url} className="h-12 w-12 rounded object-cover" alt={s.shop_name} />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-secondary"><Store className="h-5 w-5" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.shop_name}</p>
                  <p className="text-xs text-muted-foreground">{s.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.subscription_until
                      ? `До ${new Date(s.subscription_until).toLocaleDateString("ru-RU")}`
                      : "Без подписки"}
                  </p>
                </div>
                <Switch checked={s.is_active} onCheckedChange={(v) => toggleSeller(s.id, v)} />
                <Button size="icon" variant="ghost" onClick={() => deleteSeller(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
          {sellers.length === 0 && <p className="py-12 text-center text-muted-foreground">Продавцов пока нет</p>}
        </TabsContent>

        <TabsContent value="plans" className="space-y-3">
          <Card><CardContent className="grid gap-2 p-4 sm:grid-cols-4">
            <div><Label>Название</Label><Input value={pLabel} onChange={(e) => setPLabel(e.target.value)} placeholder="1 месяц" /></div>
            <div><Label>Цена</Label><Input type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} /></div>
            <div><Label>Дней</Label><Input type="number" value={pDays} onChange={(e) => setPDays(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={addPlan} className="w-full"><Plus className="mr-1 h-4 w-4" />Добавить</Button></div>
          </CardContent></Card>
          {plans.map(p => (
            <Card key={p.id}><CardContent className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.price} сом • {p.days} дней</p>
              </div>
              <Switch checked={p.is_active} onCheckedChange={(v) => togglePlan(p.id, v)} />
              <Button size="icon" variant="ghost" onClick={() => deletePlan(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellersAdmin;
