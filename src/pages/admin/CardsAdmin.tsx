import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface VipCard {
  id: string;
  card_number: string;
  card_label: string | null;
  is_active: boolean;
}

const CardsAdmin = () => {
  const [cards, setCards] = useState<VipCard[]>([]);
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("");

  const load = () => {
    supabase.from("vip_cards").select("*").order("created_at").then(({ data }) => {
      if (data) setCards(data as VipCard[]);
    });
  };

  useEffect(() => { load(); }, []);

  const addCard = async () => {
    if (!number.trim()) return;
    await supabase.from("vip_cards").insert({ card_number: number.trim(), card_label: label.trim() || null });
    setNumber(""); setLabel("");
    toast({ title: "Карта добавлена" });
    load();
  };

  const toggleActive = async (id: string, val: boolean) => {
    await supabase.from("vip_cards").update({ is_active: val }).eq("id", id);
    load();
  };

  const deleteCard = async (id: string) => {
    await supabase.from("vip_cards").delete().eq("id", id);
    toast({ title: "Карта удалена", variant: "destructive" });
    load();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Карты для оплаты
      </h2>

      {/* Add card form */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-medium text-foreground">Добавить карту</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Номер карты</Label>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="bg-secondary border-border mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Подпись (опционально)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Сбербанк / Тинькофф" className="bg-secondary border-border mt-1" />
            </div>
          </div>
          <Button onClick={addCard} className="gap-2"><Plus className="h-4 w-4" /> Добавить</Button>
        </CardContent>
      </Card>

      {/* Cards list */}
      <div className="space-y-3">
        {cards.map((c) => (
          <Card key={c.id} className="bg-gradient-card border-border">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-mono font-medium text-foreground">{c.card_number}</p>
                  {c.card_label && <p className="text-xs text-muted-foreground">{c.card_label}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={c.is_active} onCheckedChange={(v) => toggleActive(c.id, v)} />
                <Button variant="ghost" size="icon" onClick={() => deleteCard(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Карты не добавлены</p>
        )}
      </div>
    </div>
  );
};

export default CardsAdmin;
