import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Store, CheckCircle2, Clock, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface SellerPlan {
  id: string;
  label: string;
  price: number;
  days: number;
}
interface VipCard { id: string; card_number: string; card_label: string | null }
interface Seller {
  id: string;
  shop_name: string;
  is_active: boolean;
  subscription_until: string | null;
}

const getDeviceId = () => {
  let id = localStorage.getItem("kino_device_id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("kino_device_id", id); }
  return id;
};

const SellerOnboarding = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [plans, setPlans] = useState<SellerPlan[]>([]);
  const [cards, setCards] = useState<VipCard[]>([]);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);

  // Form
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const deviceId = getDeviceId();

  const load = async () => {
    const { data: sellerData } = await supabase.from("shop_sellers").select("*").eq("device_id", deviceId).maybeSingle();
    if (sellerData) {
      setSeller(sellerData as Seller);
      const { data: pending } = await supabase.from("shop_seller_subscriptions").select("id").eq("seller_id", (sellerData as any).id).eq("status", "pending");
      setHasPendingPayment((pending || []).length > 0);
    }
    const { data: planData } = await supabase.from("shop_seller_plans").select("*").eq("is_active", true).order("sort_order");
    if (planData) {
      setPlans(planData as SellerPlan[]);
      if (planData.length && !selectedPlan) setSelectedPlan((planData[0] as any).id);
    }
    const { data: cardData } = await supabase.from("vip_cards").select("*").eq("is_active", true);
    if (cardData) setCards(cardData as VipCard[]);
  };

  useEffect(() => { load(); }, []);

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("shop").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("shop").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!shopName.trim() || !phone.trim()) {
      toast({ title: "Заполните название и телефон", variant: "destructive" });
      return;
    }
    if (!selectedPlan || !screenshotFile) {
      toast({ title: "Выберите тариф и загрузите скриншот оплаты", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let logoUrl = "";
      if (logoFile) logoUrl = await uploadFile(logoFile, "sellers/logos");
      const screenshotUrl = await uploadFile(screenshotFile, "sellers/payments");

      let sellerId = seller?.id;
      if (!sellerId) {
        const { data: newSeller, error } = await supabase.from("shop_sellers").insert({
          device_id: deviceId,
          shop_name: shopName.trim(),
          description: description.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          logo_url: logoUrl,
        }).select().single();
        if (error) throw error;
        sellerId = (newSeller as any).id;
      } else {
        await supabase.from("shop_sellers").update({
          shop_name: shopName.trim(),
          description: description.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          ...(logoUrl ? { logo_url: logoUrl } : {}),
        }).eq("id", sellerId);
      }

      await supabase.from("shop_seller_subscriptions").insert({
        seller_id: sellerId,
        plan_id: selectedPlan,
        screenshot_url: screenshotUrl,
      });

      toast({ title: "Заявка отправлена! Ожидайте подтверждения админом." });
      load();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Active seller view
  if (seller?.is_active && seller.subscription_until && new Date(seller.subscription_until) > new Date()) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto flex items-center gap-2 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/shop")}><ArrowLeft className="h-5 w-5" /></Button>
            <Store className="h-5 w-5 text-primary" />
            <h1 className="text-base font-bold">Мой магазин</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-6 space-y-4">
          <Card><CardContent className="p-6 space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-xl font-bold">{seller.shop_name}</h2>
            <p className="text-sm text-muted-foreground">Подписка активна до {new Date(seller.subscription_until).toLocaleDateString("ru-RU")}</p>
            <Button className="w-full" onClick={() => navigate("/seller/dashboard")}>Открыть кабинет</Button>
          </CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/shop")}><ArrowLeft className="h-5 w-5" /></Button>
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-base font-bold">Стать продавцом</h1>
        </div>
      </header>

      <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
        {hasPendingPayment && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Ваша заявка проверяется</p>
                <p className="text-muted-foreground">После подтверждения вы получите доступ к кабинету продавца</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-bold">Информация о магазине</h2>
            <div>
              <Label>Название магазина *</Label>
              <Input value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Телефон *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992 ..." />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+992 ..." />
              </div>
            </div>
            <div>
              <Label>Логотип магазина</Label>
              <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-bold">Тариф подписки</h2>
            <div className="grid gap-2">
              {plans.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${selectedPlan === p.id ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.days} дней</p>
                  </div>
                  <p className="text-lg font-bold text-primary">{p.price} сом.</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-lg font-bold">Оплата</h2>
            <div className="rounded-lg bg-secondary/50 p-3 text-sm">
              <p className="mb-2 font-medium">Переведите сумму на одну из карт:</p>
              {cards.length === 0 && <p className="text-muted-foreground">Карты пока не добавлены админом</p>}
              {cards.map(c => (
                <div key={c.id} className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">{c.card_label || "Карта"}</span>
                  <span className="font-mono font-semibold">{c.card_number}</span>
                </div>
              ))}
            </div>
            <div>
              <Label>Скриншот оплаты *</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)} />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button className="w-full" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Отправка..." : "Отправить заявку"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerOnboarding;
