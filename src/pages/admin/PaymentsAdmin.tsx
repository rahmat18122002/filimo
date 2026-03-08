import { useState, useEffect } from "react";
import { ImageIcon, CheckCircle, XCircle, Clock, User, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  screenshot_url: string;
  status: string;
  created_at: string;
  user_name?: string;
  plan_label?: string;
  plan_months?: number | null;
  plan_price?: number;
}

const PaymentsAdmin = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = async () => {
    const { data: pays } = await supabase
      .from("vip_payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!pays) return;

    // Enrich with user names and plan info
    const userIds = [...new Set(pays.map((p: any) => p.user_id))];
    const planIds = [...new Set(pays.map((p: any) => p.plan_id))];

    const { data: users } = await supabase.from("app_users").select("id, display_name").in("id", userIds);
    const { data: plans } = await supabase.from("vip_plans").select("id, label, months, price").in("id", planIds);

    const userMap = Object.fromEntries((users || []).map((u: any) => [u.id, u.display_name]));
    const planMap = Object.fromEntries((plans || []).map((p: any) => [p.id, p]));

    setPayments(
      pays.map((p: any) => ({
        ...p,
        user_name: userMap[p.user_id] || "Неизвестный",
        plan_label: planMap[p.plan_id]?.label || "—",
        plan_months: planMap[p.plan_id]?.months,
        plan_price: planMap[p.plan_id]?.price,
      }))
    );
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (payment: Payment, action: "approved" | "rejected") => {
    await supabase.from("vip_payments").update({ status: action, reviewed_at: new Date().toISOString() }).eq("id", payment.id);

    if (action === "approved") {
      const vipUntil = payment.plan_months
        ? new Date(Date.now() + payment.plan_months * 30 * 24 * 3600 * 1000).toISOString()
        : null; // null = forever

      await supabase.from("app_users").update({
        is_vip: true,
        vip_until: vipUntil,
      }).eq("id", payment.user_id);
    }

    toast({ title: action === "approved" ? "VIP активирован" : "Платёж отклонён" });
    load();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="gap-1 text-amber-400 border-amber-400/30"><Clock className="h-3 w-3" /> Ожидает</Badge>;
      case "approved": return <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-400/30"><CheckCircle className="h-3 w-3" /> Принят</Badge>;
      case "rejected": return <Badge variant="outline" className="gap-1 text-destructive border-destructive/30"><XCircle className="h-3 w-3" /> Отклонён</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Скриншоты оплат
      </h2>

      <div className="space-y-3">
        {payments.map((p) => (
          <Card key={p.id} className="bg-gradient-card border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{p.user_name}</span>
                </div>
                {statusBadge(p.status)}
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>План: {p.plan_label}</span>
                {p.plan_price && <span>{p.plan_price}₽</span>}
                <span>{new Date(p.created_at).toLocaleDateString("ru")}</span>
              </div>

              {/* Screenshot thumbnail */}
              <div
                className="relative w-full max-w-xs cursor-pointer overflow-hidden rounded-lg border border-border"
                onClick={() => setPreviewUrl(p.screenshot_url)}
              >
                <img
                  src={p.screenshot_url}
                  alt="Скриншот"
                  className="w-full object-cover"
                  style={{ maxHeight: 200 }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
              </div>

              {p.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" className="gap-1" onClick={() => handleAction(p, "approved")}>
                    <CheckCircle className="h-4 w-4" /> Принять
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleAction(p, "rejected")}>
                    <XCircle className="h-4 w-4" /> Отклонить
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {payments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">Оплат пока нет</p>
        )}
      </div>

      {/* Full preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-lg bg-card border-border p-2">
          {previewUrl && <img src={previewUrl} alt="Скриншот оплаты" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsAdmin;
