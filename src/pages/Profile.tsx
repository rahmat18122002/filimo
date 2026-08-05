import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet, Crown, Upload, Loader2, Copy, CreditCard, Save, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, isVip, type AppUser } from "@/lib/userStore";
import { toast } from "@/hooks/use-toast";

interface Topup {
  id: string;
  amount: number;
  approved_amount: number | null;
  status: string;
  screenshot_url: string;
  created_at: string;
}

interface PayCard {
  id: string;
  card_number: string;
  card_label: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<AppUser | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [cards, setCards] = useState<PayCard[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadTopups = async (userId: string) => {
    const { data } = await supabase
      .from("balance_topups")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setTopups(data as Topup[]);
  };

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      if (u) {
        setName(u.display_name || "");
        loadTopups(u.id);
      }
    });
    supabase.from("vip_cards").select("id, card_number, card_label").eq("is_active", true).eq("purpose", "vip").then(({ data }) => {
      if (data) setCards(data as PayCard[]);
    });
  }, []);

  const saveName = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("app_users").update({ display_name: name }).eq("id", user.id);
    setSaving(false);
    if (error) return toast({ title: "Ошибка сохранения", variant: "destructive" });
    setUser({ ...user, display_name: name });
    toast({ title: "Профиль сохранён" });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const sum = parseInt(amount, 10);
    if (!sum || sum <= 0) {
      toast({ title: "Укажите сумму перевода", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/topup-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("screenshots").upload(path, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("screenshots").getPublicUrl(path);
      const { error } = await supabase.from("balance_topups").insert({
        user_id: user.id,
        amount: sum,
        screenshot_url: urlData.publicUrl,
      });
      if (error) throw error;
      setAmount("");
      toast({ title: "Чек отправлен! Ожидайте подтверждения администратора." });
      loadTopups(user.id);
    } catch (err) {
      console.error(err);
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-400/30"><CheckCircle className="h-3 w-3" /> Принят</Badge>;
    if (s === "rejected") return <Badge variant="outline" className="gap-1 text-destructive border-destructive/30"><XCircle className="h-3 w-3" /> Отклонён</Badge>;
    return <Badge variant="outline" className="gap-1 text-amber-400 border-amber-400/30"><Clock className="h-3 w-3" /> Ожидает</Badge>;
  };

  return (
    <div className="min-h-svh bg-background pb-10">
      <header className="flex items-center gap-3 px-4 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Личный кабинет</h1>
      </header>

      <div className="space-y-6 px-4">
        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-accent/30 bg-accent/10">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <Wallet className="h-7 w-7 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ваш баланс</p>
                <p className="text-3xl font-bold text-accent">{user?.balance ?? 0}₽</p>
                {user && isVip(user) && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent">
                    <Crown className="h-3.5 w-3.5" />
                    {user.vip_until
                      ? `VIP — осталось ${Math.max(0, Math.ceil((new Date(user.vip_until).getTime() - Date.now()) / 86400000))} дн.`
                      : "VIP навсегда ∞"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Профиль</h2>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" />
          <Button onClick={saveName} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Сохранить
          </Button>
        </div>

        {/* Cards */}
        {cards.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Переведите на карту</h2>
            {cards.map((c) => (
              <Card key={c.id} className="border-border bg-gradient-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-mono font-medium text-foreground">{c.card_number}</p>
                      {c.card_label && <p className="text-xs text-muted-foreground">{c.card_label}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(c.card_number); toast({ title: "Номер скопирован" }); }}>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Topup */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Пополнить баланс</h2>
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сумма перевода, ₽"
          />
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleUpload} />
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed border-accent/50 py-8"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !user}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {uploading ? "Загрузка..." : "Загрузить чек"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Администратор проверит чек. Из суммы спишется абонплата VIP за месяц, остаток останется на вашем балансе.
          </p>
        </div>

        {/* History */}
        {topups.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">История пополнений</h2>
            {topups.map((t) => (
              <Card key={t.id} className="border-border bg-gradient-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-foreground">
                      {t.status === "approved" && t.approved_amount != null ? t.approved_amount : t.amount}₽
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("ru")}</p>
                  </div>
                  {statusBadge(t.status)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
