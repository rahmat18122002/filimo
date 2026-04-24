import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, SlidersHorizontal, ShoppingCart, X, ChevronDown, Home, Phone, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShopProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  in_stock: boolean;
  category_id: string | null;
  view_count: number;
  created_at: string;
}

interface ShopCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

type SortOption = "popular" | "cheap" | "expensive" | "new";

const Shop = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [shopPhone, setShopPhone] = useState("");
  const [shopWhatsapp, setShopWhatsapp] = useState("");

  useEffect(() => {
    supabase.from("shop_products").select("*").eq("is_active", true).then(({ data }) => {
      if (data) setProducts(data as ShopProduct[]);
    });
    supabase.from("shop_categories").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (data) setCategories(data as ShopCategory[]);
    });
    supabase.from("bot_settings").select("key, value").in("key", ["shop_phone", "shop_whatsapp"]).then(({ data }) => {
      if (data) {
        for (const row of data) {
          if (row.key === "shop_phone") setShopPhone(row.value);
          if (row.key === "shop_whatsapp") setShopWhatsapp(row.value);
        }
      }
    });
    // Cart count
    const deviceId = localStorage.getItem("kino_device_id");
    if (deviceId) {
      supabase.from("shop_cart_items").select("quantity").eq("device_id", deviceId).then(({ data }) => {
        if (data) setCartCount(data.reduce((s, i) => s + (i as any).quantity, 0));
      });
    }
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) result = result.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
    if (selectedCategory) result = result.filter(p => p.category_id === selectedCategory);
    switch (sortBy) {
      case "popular": result.sort((a, b) => b.view_count - a.view_count); break;
      case "cheap": result.sort((a, b) => a.price - b.price); break;
      case "expensive": result.sort((a, b) => b.price - a.price); break;
      case "new": result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [products, search, selectedCategory, sortBy]);

  const sortLabels: Record<SortOption, string> = {
    popular: "Популярные",
    cheap: "Дешёвые",
    expensive: "Дорогие",
    new: "Новинки",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/home")} title="Главное меню">
            <Home className="h-5 w-5" />
          </Button>
          <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
          <h1 className="text-base font-bold text-foreground">Магазин</h1>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск товаров..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Все
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(Object.keys(sortLabels) as SortOption[]).map(key => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === key ? "bg-accent text-accent-foreground" : "bg-secondary/50 text-muted-foreground"
              }`}
            >
              {sortLabels[key]}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="cursor-pointer group"
              onClick={() => navigate(`/shop/${product.id}`)}
            >
              <div className="relative overflow-hidden rounded-2xl bg-secondary aspect-square">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {!product.in_stock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <span className="rounded-full bg-destructive/90 px-3 py-1 text-xs font-bold text-destructive-foreground">Нет в наличии</span>
                  </div>
                )}
              </div>
              <div className="mt-2 px-1">
                <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.title}</h3>
                <p className="mt-1 text-sm font-bold text-primary">{product.price} сом.</p>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <ShoppingBag className="mb-4 h-12 w-12" />
            <p className="font-medium">Товары не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
