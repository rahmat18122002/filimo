import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SettingsAdmin = () => {
  const [appName, setAppName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("*")
      .eq("key", "app_name")
      .single()
      .then(({ data }) => {
        if (data) setAppName((data as any).value);
      });
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
    </div>
  );
};

export default SettingsAdmin;
