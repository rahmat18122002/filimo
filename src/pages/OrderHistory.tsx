import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  customer_name: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Ожидает", color: "text-amber-500", icon: Clock },
  confirmed: { label: "Подтверждён", color: "text-emerald-500", icon: CheckCircle2 },
  rejected: { label: "Отклонён", color: "text-destructive", icon: XCircle },
};

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const deviceId = localStorage.getItem("kino_device_id") || "";

  useEffect(() => {
    if (!deviceId) { setLoading(false); return; }
    supabase.from("shop_orders")
      .select("id, total_amount, status, created_at, customer_name")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data as Order[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Мои заказы</h1>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <Package className="mb-4 h-12 w-12" />
            <p className="font-medium">Заказов пока нет</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/shop")}>
              В магазин
            </Button>
          </div>
        ) : (
          orders.map(order => {
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("ru")}
                  </span>
                  <div className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </div>
                </div>
                <p className="mt-2 font-medium text-foreground">Заказ #{order.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm font-bold text-primary">{order.total_amount} сом.</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
