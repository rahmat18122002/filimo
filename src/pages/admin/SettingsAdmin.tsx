import { useState, useEffect } from "react";
import { Settings, Save, Bot, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SettingsAdmin = () => {
  const [appName, setAppName] = useState("");
  const [botToken, setBotToken] = useState("");
  const [botUsername, setBotUsername] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopWhatsapp, setShopWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingBot, setSavingBot] = useState(false);
  const [savingShop, setSavingShop] = useState(false);

  useEffect(() => {
    // Load all settings in parallel
    const loadSettings = async () => {
      const keys = ["app_name", "bot_token", "bot_username", "shop_phone", "shop_whatsapp"];
      const { data } = await supabase
        .from("bot_settings")
        .select("key, value")
        .in("key", keys);

      const appRes = await supabase
        .from("app_settings")
        .select("*")
        .eq("key", "app_name")
        .single();

      if (appRes.data) setAppName((appRes.data as any).value);

      if (data) {
        for (const row of data) {
          if (row.key === "bot_token") setBotToken(row.value);
          if (row.key === "bot_username") setBotUsername(row.value);
          if (row.key === "shop_phone") setShopPhone(row.value);
          if (row.key === "shop_whatsapp") setShopWhatsapp(row.value);
        }
      }
    };
    loadSettings();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({ value: appName.trim() })
      .eq("key", "app_name");
    setSaving(false);
    if (error) {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } else {
      toast({ title: "Название сохранено" });
    }
  };

  const saveBot = async () => {
    setSavingBot(true);
    try {
      for (const [key, value] of [["bot_token", botToken.trim()], ["bot_username", botUsername.trim()]]) {
        const { data: existing } = await supabase
          .from("bot_settings")
          .select("id")
          .eq("key", key)
          .single();

        if (existing) {
          await supabase.from("bot_settings").update({ value }).eq("key", key);
        } else {
          await supabase.from("bot_settings").insert({ key, value });
        }
      }
      toast({ title: "Настройки бота сохранены" });
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    }
    setSavingBot(false);
  };

  const saveShop = async () => {
    setSavingShop(true);
    try {
      for (const [key, value] of [["shop_phone", shopPhone.trim()], ["shop_whatsapp", shopWhatsapp.trim()]]) {
        const { data: existing } = await supabase
          .from("bot_settings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          await supabase.from("bot_settings").update({ value }).eq("key", key);
        } else {
          await supabase.from("bot_settings").insert({ key, value });
        }
      }
      toast({ title: "Контакты магазина сохранены" });
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    }
    setSavingShop(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Настройки приложения
      </h2>

      <Card className="bg-gradient-card border-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Название приложения</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Имя, отображаемое в приложении</Label>
            <Input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Filimo"
              className="bg-secondary border-border mt-1"
            />
          </div>
          <Button onClick={save} disabled={saving || !appName.trim()} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Telegram Бот</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Токен бота (от @BotFather)</Label>
            <Input
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF..."
              type="password"
              className="bg-secondary border-border mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Username бота (без @)</Label>
            <Input
              value={botUsername}
              onChange={(e) => setBotUsername(e.target.value)}
              placeholder="my_movie_bot"
              className="bg-secondary border-border mt-1"
            />
          </div>
          <Button onClick={saveBot} disabled={savingBot} className="gap-2">
            <Save className="h-4 w-4" />
            {savingBot ? "Сохранение..." : "Сохранить настройки бота"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Контакты магазина</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Номер для звонков</Label>
            <Input
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              placeholder="+992 900 00 00 00"
              className="bg-secondary border-border mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Номер WhatsApp (с кодом страны, без +)</Label>
            <Input
              value={shopWhatsapp}
              onChange={(e) => setShopWhatsapp(e.target.value)}
              placeholder="992900000000"
              className="bg-secondary border-border mt-1"
            />
          </div>
          <Button onClick={saveShop} disabled={savingShop} className="gap-2">
            <Save className="h-4 w-4" />
            {savingShop ? "Сохранение..." : "Сохранить контакты"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsAdmin;
