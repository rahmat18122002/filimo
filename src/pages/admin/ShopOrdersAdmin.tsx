import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: string;
  screenshot_url: string | null;
  created_at: string;
  device_id: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Ожидает", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  confirmed: { label: "Подтверждён", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
  rejected: { label: "Отклонён", color: "text-destructive bg-destructive/10", icon: XCircle },
};

const ShopOrdersAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewScreenshot, setViewScreenshot] = useState<string | null>(null);

  const load = () => {
    supabase.from("shop_orders").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setOrders(data as Order[]);
    });
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("shop_orders").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    toast({ title: `Заказ ${status === "confirmed" ? "подтверждён" : "отклонён"}` });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Заказы магазина</h2>

      {/* Screenshot modal */}
      {viewScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewScreenshot(null)}>
          <img src={viewScreenshot} alt="screenshot" className="max-h-[80vh] max-w-full rounded-xl" />
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const cfg = statusConfig[order.status] || statusConfig.pending;
          const Icon = cfg.icon;
          return (
            <div key={order.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("ru")}</span>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                  <Icon className="h-3 w-3" /> {cfg.label}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Имя:</span> <span className="font-medium">{order.customer_name}</span></p>
                <p><span className="text-muted-foreground">Тел:</span> <span className="font-medium">{order.customer_phone}</span></p>
                {order.customer_address && <p><span className="text-muted-foreground">Адрес:</span> {order.customer_address}</p>}
                <p><span className="text-muted-foreground">Сумма:</span> <span className="font-bold text-primary">{order.total_amount} сом.</span></p>
              </div>
              <div className="flex items-center gap-2">
                {order.screenshot_url && (
                  <Button variant="outline" size="sm" onClick={() => setViewScreenshot(order.screenshot_url)} className="gap-1">
                    <Eye className="h-3.5 w-3.5" /> Скриншот
                  </Button>
                )}
                {order.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(order.id, "confirmed")} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                      <Check className="h-3.5 w-3.5" /> Подтвердить
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "rejected")} className="gap-1">
                      <X className="h-3.5 w-3.5" /> Отклонить
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && <p className="text-center text-muted-foreground py-10">Заказов пока нет</p>}
      </div>
    </div>
  );
};

export default ShopOrdersAdmin;
