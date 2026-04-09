import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    in_stock: boolean;
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceId = localStorage.getItem("kino_device_id") || "";

  const loadCart = async () => {
    if (!deviceId) { setLoading(false); return; }
    const { data } = await supabase
      .from("shop_cart_items")
      .select("id, product_id, quantity, product:shop_products(id, title, price, image_url, in_stock)")
      .eq("device_id", deviceId);
    if (data) setItems(data.map((d: any) => ({ ...d, product: d.product })));
    setLoading(false);
  };

  useEffect(() => { loadCart(); }, []);

  const updateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) {
      await supabase.from("shop_cart_items").delete().eq("id", itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      return;
    }
    await supabase.from("shop_cart_items").update({ quantity: newQty }).eq("id", itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("shop_cart_items").delete().eq("id", itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    toast({ title: "Удалено из корзины" });
  };

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Корзина</h1>
        <span className="text-sm text-muted-foreground">({items.length})</span>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <ShoppingCart className="mb-4 h-12 w-12" />
            <p className="font-medium">Корзина пуста</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/shop")}>
              В магазин
            </Button>
          </div>
        ) : (
          <>
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt={item.product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground line-clamp-1">{item.product.title}</h3>
                    <p className="text-sm font-bold text-primary">{item.product.price} сом.</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 rounded-full border border-border">
                      <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1.5">
                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <span className="min-w-[20px] text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1.5">
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Total */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-foreground">Итого:</span>
                <span className="text-xl font-bold text-primary">{total} сом.</span>
              </div>
              <Button className="mt-4 w-full gap-2 py-6 text-base" onClick={() => navigate("/checkout")}>
                Оформить заказ
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
