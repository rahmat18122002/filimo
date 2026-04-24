import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Store, Phone, MessageCircle, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Seller {
  id: string;
  shop_name: string;
  description: string;
  phone: string;
  whatsapp: string;
  logo_url: string;
  is_active: boolean;
  subscription_until: string | null;
}
interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string;
  in_stock: boolean;
}

const SellerStorefront = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase.from("shop_sellers").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setSeller(data as Seller);
    });
    supabase.from("shop_products").select("*").eq("seller_id", id).eq("is_active", true).then(({ data }) => {
      if (data) setProducts(data as Product[]);
    });
  }, [id]);

  if (!seller) return <div className="flex min-h-screen items-center justify-center">Загрузка...</div>;

  const isActive = seller.is_active && seller.subscription_until && new Date(seller.subscription_until) > new Date();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <Store className="h-5 w-5 text-primary" />
          <h1 className="text-base font-bold truncate">{seller.shop_name}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4">
          {seller.logo_url ? (
            <img src={seller.logo_url} className="h-16 w-16 rounded-xl object-cover" alt={seller.shop_name} />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary"><Store className="h-7 w-7 text-muted-foreground" /></div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold">{seller.shop_name}</h2>
            {seller.description && <p className="text-sm text-muted-foreground line-clamp-2">{seller.description}</p>}
          </div>
        </div>

        {!isActive && (
          <div className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-600">Магазин временно неактивен</div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map(p => (
            <div key={p.id} className="cursor-pointer group" onClick={() => navigate(`/shop/${p.id}`)}>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-10 w-10 text-muted-foreground" /></div>
                )}
                {!p.in_stock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <span className="rounded-full bg-destructive/90 px-3 py-1 text-xs font-bold text-destructive-foreground">Нет в наличии</span>
                  </div>
                )}
              </div>
              <div className="mt-2 px-1">
                <h3 className="text-sm font-medium line-clamp-2">{p.title}</h3>
                <p className="mt-1 text-sm font-bold text-primary">{p.price} сом.</p>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && <p className="py-12 text-center text-muted-foreground">Товаров пока нет</p>}
      </div>

      {(seller.phone || seller.whatsapp) && (
        <div className="fixed bottom-6 right-4 z-40 flex flex-col gap-3">
          {seller.whatsapp && (
            <a href={`https://wa.me/${seller.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(142_70%_45%)] text-white shadow-lg">
              <MessageCircle className="h-5 w-5" />
            </a>
          )}
          {seller.phone && (
            <a href={`tel:${seller.phone.replace(/\s/g, "")}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Phone className="h-5 w-5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerStorefront;
