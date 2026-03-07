import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Satellite, RefreshCw, Tv } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface LiveChannel {
  id: string;
  name: string;
  logo_url: string;
  stream_url: string;
  category: string;
  source: string;
  is_active: boolean;
  sort_order: number;
}

const LiveChannelsAdmin = () => {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    logo_url: "",
    stream_url: "",
    category: "Общие",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("live_channels")
      .select("*")
      .order("sort_order");
    setChannels((data as LiveChannel[]) || []);
    setLoading(false);
  };

  const syncSputnik = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-sputnik-channels");
      if (error) throw error;
      toast({
        title: "🛰️ Синхронизация завершена",
        description: `Синхронизировано каналов: ${data?.synced || 0}`,
      });
      fetchChannels();
    } catch (e: any) {
      toast({ title: "Ошибка синхронизации", description: e.message, variant: "destructive" });
    }
    setSyncing(false);
  };

  const addChannel = async () => {
    if (!newChannel.name || !newChannel.stream_url) return;
    const { error } = await supabase.from("live_channels").insert({
      name: newChannel.name,
      logo_url: newChannel.logo_url,
      stream_url: newChannel.stream_url,
      category: newChannel.category,
      source: "manual",
      sort_order: channels.length,
    });
    if (!error) {
      setNewChannel({ name: "", logo_url: "", stream_url: "", category: "Общие" });
      fetchChannels();
      toast({ title: "Канал добавлен" });
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("live_channels").update({ is_active: active }).eq("id", id);
    fetchChannels();
  };

  const deleteChannel = async (id: string) => {
    await supabase.from("live_channels").delete().eq("id", id);
    fetchChannels();
    toast({ title: "Канал удалён" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Satellite className="h-5 w-5" />
          Live TV каналы
        </h2>
        <Button onClick={syncSputnik} disabled={syncing} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          🛰️ Синхронизировать Sputnik
        </Button>
      </div>

      {/* Add channel form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" /> Добавить канал вручную
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Название</Label>
              <Input
                value={newChannel.name}
                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                placeholder="Gem TV"
              />
            </div>
            <div>
              <Label>Категория</Label>
              <Input
                value={newChannel.category}
                onChange={(e) => setNewChannel({ ...newChannel, category: e.target.value })}
                placeholder="Развлечения"
              />
            </div>
            <div>
              <Label>URL потока</Label>
              <Input
                value={newChannel.stream_url}
                onChange={(e) => setNewChannel({ ...newChannel, stream_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>URL логотипа</Label>
              <Input
                value={newChannel.logo_url}
                onChange={(e) => setNewChannel({ ...newChannel, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <Button onClick={addChannel} className="gap-2">
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </CardContent>
      </Card>

      {/* Channels list */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Загрузка...</p>
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => (
            <Card key={ch.id}>
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary shrink-0 overflow-hidden">
                  {ch.logo_url ? (
                    <img src={ch.logo_url} alt={ch.name} className="h-8 w-8 object-contain" />
                  ) : (
                    <Tv className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{ch.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {ch.category} • {ch.source === "sputnik" ? "🛰️ Sputnik" : "✋ Вручную"}
                  </p>
                </div>
                <Switch checked={ch.is_active} onCheckedChange={(v) => toggleActive(ch.id, v)} />
                <Button variant="ghost" size="icon" onClick={() => deleteChannel(ch.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveChannelsAdmin;
