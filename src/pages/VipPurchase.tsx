import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, CreditCard, Upload, Check, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, type AppUser } from "@/lib/userStore";
import { toast } from "@/hooks/use-toast";

interface VipPlan {
  id: string;
  label: string;
  months: number | null;
  price: number;
}

interface VipCard {
  id: string;
  card_number: string;
  card_label: string | null;
}

const VipPurchase = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<VipPlan[]>([]);
  const [cards, setCards] = useState<VipCard[]>([]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    supabase.from("vip_plans").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (data) setPlans(data as VipPlan[]);
    });
    supabase.from("vip_cards").select("*").eq("is_active", true).then(({ data }) => {
      if (data) setCards(data as VipCard[]);
    });
  }, []);

  const copyCard = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: "Номер карты скопирован" });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedPlan) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("screenshots").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("screenshots").getPublicUrl(path);

      await supabase.from("vip_payments").insert({
        user_id: user.id,
        plan_id: selectedPlan.id,
        screenshot_url: urlData.publicUrl,
      });

      setSubmitted(true);
      toast({ title: "Скриншот отправлен! Ожидайте подтверждения." });
    } catch (err) {
      console.error(err);
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground">Оплата отправлена</h2>
        <p className="mt-2 text-sm text-muted-foreground">Админ проверит ваш скриншот и активирует VIP</p>
        <Button onClick={() => navigate("/home")} className="mt-6">На главную</Button>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background pb-8">
      <header className="flex items-center gap-3 px-4 py-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Купить VIP</h1>
      </header>

      <div className="px-4 space-y-6">
        {/* Plans */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Выберите план</h2>
          {plans.map((plan) => (
            <motion.div key={plan.id} whileTap={{ scale: 0.98 }}>
              <Card
                className={`cursor-pointer border transition-colors ${
                  selectedPlan?.id === plan.id ? "border-accent bg-accent/10" : "border-border bg-gradient-card"
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Crown className={`h-5 w-5 ${selectedPlan?.id === plan.id ? "text-accent" : "text-muted-foreground"}`} />
                    <span className="font-medium text-foreground">{plan.label}</span>
                  </div>
                  <span className="text-lg font-bold text-accent">{plan.price}₽</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Cards */}
        {selectedPlan && cards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Переведите {selectedPlan.price}₽ на карту</h2>
            {cards.map((card) => (
              <Card key={card.id} className="border-border bg-gradient-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-mono font-medium text-foreground">{card.card_number}</p>
                      {card.card_label && <p className="text-xs text-muted-foreground">{card.card_label}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyCard(card.card_number)}>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Upload screenshot */}
        {selectedPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Загрузите скриншот оплаты</h2>
            <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleUpload} />
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed border-accent/50 py-8"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {uploading ? "Загрузка..." : "Выбрать скриншот"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VipPurchase;
