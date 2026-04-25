import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, Loader2, Check, Phone, User, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/userStore";

const Checkout = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [total, setTotal] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [shopCards, setShopCards] = useState<{ id: string; card_number: string; card_label: string | null }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const deviceId = localStorage.getItem("kino_device_id") || "";

  useEffect(() => {
    if (!deviceId) return;
    supabase.from("shop_cart_items")
      .select("id, product_id, quantity, product:shop_products(id, title, price)")
      .eq("device_id", deviceId)
      .then(({ data }) => {
        if (data) {
          setCartItems(data);
          setTotal(data.reduce((s: number, i: any) => s + i.product.price * i.quantity, 0));
        }
      });
    supabase.from("vip_cards")
      .select("id, card_number, card_label, purpose, is_active")
      .eq("is_active", true)
      .eq("purpose" as any, "shop")
      .then(({ data }) => { if (data) setShopCards(data as any); });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `orders/${deviceId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("shop").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("shop").getPublicUrl(path);
      setScreenshotUrl(urlData.publicUrl);
      toast({ title: "Скриншот загружен!" });
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Заполните имя и телефон", variant: "destructive" });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Корзина пуста", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const user = await getCurrentUser();

      // Get seller_id for each product to split orders by seller
      const productIds = cartItems.map((ci: any) => ci.product.id);
      const { data: prodInfo } = await supabase.from("shop_products").select("id, seller_id").in("id", productIds);
      const sellerByProduct: Record<string, string | null> = {};
      (prodInfo || []).forEach((p: any) => { sellerByProduct[p.id] = p.seller_id || null; });

      // Group cart items by seller
      const groups: Record<string, any[]> = {};
      cartItems.forEach((ci: any) => {
        const sid = sellerByProduct[ci.product.id] || "platform";
        if (!groups[sid]) groups[sid] = [];
        groups[sid].push(ci);
      });

      for (const sid of Object.keys(groups)) {
        const items = groups[sid];
        const orderTotal = items.reduce((s: number, i: any) => s + i.product.price * i.quantity, 0);
        const { data: order, error } = await supabase.from("shop_orders").insert({
          device_id: deviceId,
          user_id: user?.id || null,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          customer_address: address.trim(),
          screenshot_url: screenshotUrl || null,
          total_amount: orderTotal,
          seller_id: sid === "platform" ? null : sid,
        }).select().single();
        if (error) throw error;

        const orderItems = items.map((ci: any) => ({
          order_id: (order as any).id,
          product_id: ci.product.id,
          product_title: ci.product.title,
          quantity: ci.quantity,
          price: ci.product.price,
        }));
        await supabase.from("shop_order_items").insert(orderItems);
      }

      // Clear cart
      await supabase.from("shop_cart_items").delete().eq("device_id", deviceId);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Ошибка", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-8 w-8 text-emerald-400" />
        </motion.div>
        <h2 className="text-xl font-bold text-foreground">Заказ отправлен!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Мы проверим оплату и свяжемся с вами</p>
        <Button onClick={() => navigate("/shop")} className="mt-6">В магазин</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Оформление заказа</h1>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-6">
        {/* Contact form */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Контактные данные</h2>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} className="pl-10" />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Телефон +992..." value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Адрес / Комментарий" value={address} onChange={e => setAddress(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Оплата</h2>
          <div className="rounded-2xl border border-border bg-card p-4 text-sm text-foreground">
            <p className="font-medium">Душанбе Сити / перевод на номер</p>
            <p className="mt-1 text-muted-foreground">Оплатите <span className="font-bold text-primary">{total} сом.</span> на номер:</p>
            <p className="mt-2 font-mono text-lg font-bold text-foreground">+992 XXX-XX-XX-XX</p>
          </div>
        </div>

        {/* Screenshot upload */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Скриншот оплаты</h2>
          <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleUpload} />
          {screenshotUrl ? (
            <div className="relative overflow-hidden rounded-2xl">
              <img src={screenshotUrl} alt="screenshot" className="w-full rounded-2xl" />
              <button
                onClick={() => setScreenshotUrl("")}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-muted-foreground"
              >
                ✕
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed border-accent/50 py-8"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {uploading ? "Загрузка..." : "Загрузить скриншот"}
            </Button>
          )}
        </div>

        {/* Submit */}
        <Button
          className="w-full gap-2 py-6 text-base"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          Отправить заказ
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
