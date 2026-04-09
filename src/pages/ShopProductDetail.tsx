import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  in_stock: boolean;
  category_id: string | null;
}

interface ProductImage {
  id: string;
  image_url: string;
  sort_order: number;
}

const ShopProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("shop_products").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setProduct(data as Product);
    });
    supabase.from("shop_product_images").select("*").eq("product_id", id).order("sort_order").then(({ data }) => {
      if (data) setImages(data as ProductImage[]);
    });
  }, [id]);

  const allImages = product ? [product.image_url, ...images.map(i => i.image_url)].filter(Boolean) : [];

  const addToCart = async () => {
    if (!product) return;
    setAdding(true);
    const deviceId = localStorage.getItem("kino_device_id") || "unknown";
    const { error } = await supabase.from("shop_cart_items").upsert(
      { device_id: deviceId, product_id: product.id, quantity: 1 },
      { onConflict: "device_id,product_id" }
    );
    if (!error) {
      // If exists, increment
      const { data: existing } = await supabase.from("shop_cart_items")
        .select("quantity")
        .eq("device_id", deviceId)
        .eq("product_id", product.id)
        .single();
      if (existing && (existing as any).quantity === 1) {
        // just inserted
      }
      setAdded(true);
      toast({ title: "Добавлено в корзину!" });
      setTimeout(() => setAdded(false), 2000);
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
    setAdding(false);
  };

  if (!product) {
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
        <h1 className="text-lg font-bold text-foreground line-clamp-1">{product.title}</h1>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={() => navigate("/cart")}>
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-6">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
            {allImages[selectedImage] ? (
              <img src={allImages[selectedImage]} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === selectedImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">{product.title}</h2>
          <p className="text-2xl font-bold text-primary">{product.price} сом.</p>
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            product.in_stock ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
          }`}>
            <span className={`h-2 w-2 rounded-full ${product.in_stock ? "bg-emerald-500" : "bg-destructive"}`} />
            {product.in_stock ? "В наличии" : "Нет в наличии"}
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}
        </div>

        {/* Add to cart */}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full gap-2 py-6 text-base"
            disabled={!product.in_stock || adding}
            onClick={addToCart}
          >
            {added ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            {added ? "Добавлено!" : "Добавить в корзину"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ShopProductDetail;
