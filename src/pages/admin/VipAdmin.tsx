import { useState } from "react";
import { Crown, DollarSign, Users, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface VipPlan {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string[];
  active: boolean;
  subscribers: number;
}

const initialPlans: VipPlan[] = [
  {
    id: 1,
    name: "VIP Базовый",
    price: 299,
    period: "мес",
    features: ["Без рекламы", "HD качество", "Ранний доступ"],
    active: true,
    subscribers: 89,
  },
  {
    id: 2,
    name: "VIP Премиум",
    price: 599,
    period: "мес",
    features: ["Без рекламы", "4K качество", "Ранний доступ", "Эксклюзивный контент", "Оффлайн просмотр"],
    active: true,
    subscribers: 45,
  },
  {
    id: 3,
    name: "VIP Годовой",
    price: 2999,
    period: "год",
    features: ["Все функции Премиум", "Скидка 58%", "Приоритетная поддержка"],
    active: true,
    subscribers: 22,
  },
];

const vipStats = [
  { label: "Активных подписок", value: 156, icon: Crown, color: "text-accent" },
  { label: "Доход (мес.)", value: "$4,280", icon: DollarSign, color: "text-emerald-400" },
  { label: "Конверсия", value: "12.1%", icon: TrendingUp, color: "text-blue-400" },
  { label: "Новых за неделю", value: 18, icon: Users, color: "text-violet-400" },
];

const VipAdmin = () => {
  const [plans, setPlans] = useState<VipPlan[]>(initialPlans);
  const [isOpen, setIsOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<VipPlan | null>(null);
  const [form, setForm] = useState({ name: "", price: "", period: "мес", features: "" });

  const openNew = () => {
    setEditPlan(null);
    setForm({ name: "", price: "", period: "мес", features: "" });
    setIsOpen(true);
  };

  const openEdit = (p: VipPlan) => {
    setEditPlan(p);
    setForm({ name: p.name, price: String(p.price), period: p.period, features: p.features.join("\n") });
    setIsOpen(true);
  };

  const handleSave = () => {
    const plan: VipPlan = {
      id: editPlan?.id ?? Date.now(),
      name: form.name,
      price: Number(form.price),
      period: form.period,
      features: form.features.split("\n").filter(Boolean),
      active: editPlan?.active ?? true,
      subscribers: editPlan?.subscribers ?? 0,
    };
    if (editPlan) {
      setPlans((prev) => prev.map((p) => (p.id === editPlan.id ? plan : p)));
      toast({ title: "План обновлён" });
    } else {
      setPlans((prev) => [...prev, plan]);
      toast({ title: "План создан" });
    }
    setIsOpen(false);
  };

  const toggleActive = (id: number) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));
  };

  const deletePlan = (id: number) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "План удалён", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          VIP-подписки
        </h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Новый план
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vipStats.map((s) => (
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

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={`bg-gradient-card border-border relative ${!p.active && "opacity-50"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground">{p.name}</CardTitle>
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-primary">₽{p.price}</span>
                <span className="text-sm text-muted-foreground">/{p.period}</span>
              </div>
              <p className="text-sm text-muted-foreground">{p.subscribers} подписчиков</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Crown className="h-3.5 w-3.5 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" /> Изменить
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deletePlan(p.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info about Stripe */}
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="flex items-start gap-4 p-5">
          <DollarSign className="mt-0.5 h-5 w-5 text-accent shrink-0" />
          <div>
            <p className="font-medium text-foreground">Подключите Stripe для приёма платежей</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Для автоматического приёма оплат за VIP-подписки необходимо подключить Stripe и базу данных через Lovable Cloud.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{editPlan ? "Редактировать план" : "Новый VIP-план"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Название</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Цена (₽)</Label>
                <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="grid gap-2">
                <Label>Период</Label>
                <Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Функции (каждая с новой строки)</Label>
              <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="bg-secondary border-border" rows={4} />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editPlan ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VipAdmin;
