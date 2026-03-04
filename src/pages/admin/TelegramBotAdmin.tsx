import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Plus, Trash2, Bot, Shield, ShieldOff, BarChart3, Hash } from "lucide-react";

interface BotChannel {
  id: string;
  title: string;
  username: string | null;
  chat_id: string;
  channel_type: string;
  invite_link: string | null;
  is_active: boolean;
  sort_order: number;
}

interface BotStat {
  action: string;
  count: number;
}

const TelegramBotAdmin = () => {
  const [channels, setChannels] = useState<BotChannel[]>([]);
  const [copyProtection, setCopyProtection] = useState(true);
  const [autoDeleteHours, setAutoDeleteHours] = useState("1");
  const [stats, setStats] = useState<BotStat[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // New channel form
  const [newTitle, setNewTitle] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newInviteLink, setNewInviteLink] = useState("");
  const [newType, setNewType] = useState("public");
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    const [chRes, cpRes, adRes, statsRes] = await Promise.all([
      supabase.from("bot_channels").select("*").order("sort_order"),
      supabase.from("bot_settings").select("value").eq("key", "copy_protection").single(),
      supabase.from("bot_settings").select("value").eq("key", "auto_delete_hours").single(),
      supabase.from("bot_stats").select("action"),
    ]);

    if (chRes.data) setChannels(chRes.data as BotChannel[]);
    if (cpRes.data) setCopyProtection((cpRes.data as any).value === "true");
    if (adRes.data) setAutoDeleteHours((adRes.data as any).value);

    // Count stats
    if (statsRes.data) {
      const raw = statsRes.data as any[];
      const uniqueUsers = new Set(raw.map(r => r.telegram_user_id)).size;
      setTotalUsers(uniqueUsers);
      const counts: Record<string, number> = {};
      raw.forEach(r => { counts[r.action] = (counts[r.action] || 0) + 1; });
      setStats(Object.entries(counts).map(([action, count]) => ({ action, count })));
    }
  };

  useEffect(() => { load(); }, []);

  const addChannel = async () => {
    if (!newTitle || !newChatId) {
      toast({ title: "Заполните название и Chat ID" });
      return;
    }
    await supabase.from("bot_channels").insert({
      title: newTitle,
      chat_id: newChatId,
      username: newUsername || null,
      invite_link: newInviteLink || null,
      channel_type: newType,
    });
    setNewTitle(""); setNewChatId(""); setNewUsername(""); setNewInviteLink("");
    setNewType("public"); setDialogOpen(false);
    toast({ title: "Канал добавлен!" });
    load();
  };

  const deleteChannel = async (id: string) => {
    await supabase.from("bot_channels").delete().eq("id", id);
    toast({ title: "Канал удалён" });
    load();
  };

  const toggleProtection = async (val: boolean) => {
    setCopyProtection(val);
    await supabase.from("bot_settings").update({ value: val ? "true" : "false" }).eq("key", "copy_protection");
    toast({ title: val ? "🔒 Защита включена" : "🔓 Защита отключена" });
  };

  const saveDeleteHours = async () => {
    await supabase.from("bot_settings").update({ value: autoDeleteHours }).eq("key", "auto_delete_hours");
    toast({ title: `Авто-удаление: ${autoDeleteHours} ч.` });
  };

  const typeLabel: Record<string, string> = {
    public: "📢 Публичный",
    private: "🔒 Частный",
    private_request: "📝 С заявкой",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bot className="h-6 w-6" /> Telegram-бот
        </h2>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-4 w-4" /> Пользователи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
          </CardContent>
        </Card>
        {stats.map(s => (
          <Card key={s.action}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground capitalize">{s.action}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{s.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {copyProtection ? <Shield className="h-5 w-5 text-primary" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
            Настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Защита от копирования</p>
              <p className="text-sm text-muted-foreground">Запрещает пересылку и копирование контента</p>
            </div>
            <Switch checked={copyProtection} onCheckedChange={toggleProtection} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-foreground">Авто-удаление (часы)</p>
              <p className="text-sm text-muted-foreground">Через сколько часов удалять фильм из чата</p>
            </div>
            <Input
              type="number"
              min="1"
              max="72"
              value={autoDeleteHours}
              onChange={e => setAutoDeleteHours(e.target.value)}
              className="w-20"
            />
            <Button variant="outline" size="sm" onClick={saveDeleteHours}>Сохр.</Button>
          </div>
        </CardContent>
      </Card>

      {/* Channels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" /> Каналы ({channels.length})
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Добавить</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Добавить канал</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Название канала" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <Input placeholder="Chat ID (напр. -1001234567890)" value={newChatId} onChange={e => setNewChatId(e.target.value)} />
                <Input placeholder="@username (необязательно)" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
                <Input placeholder="Invite link (необязательно)" value={newInviteLink} onChange={e => setNewInviteLink(e.target.value)} />
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">📢 Публичный канал</SelectItem>
                    <SelectItem value="private">🔒 Частный канал</SelectItem>
                    <SelectItem value="private_request">📝 Частный с заявкой</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Отмена</Button></DialogClose>
                <Button onClick={addChannel}>Добавить</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет каналов. Добавьте первый.</p>
          ) : (
            <div className="space-y-3">
              {channels.map(ch => (
                <div key={ch.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{ch.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{typeLabel[ch.channel_type] || ch.channel_type}</Badge>
                      <span className="text-xs text-muted-foreground">{ch.chat_id}</span>
                      {ch.username && <span className="text-xs text-muted-foreground">{ch.username}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteChannel(ch.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot setup instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Инструкция по запуску бота</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Скачайте файл <code className="rounded bg-secondary px-1 py-0.5 text-foreground">telegram_bot.py</code> из корня проекта</p>
          <p>2. Установите зависимости: <code className="rounded bg-secondary px-1 py-0.5 text-foreground">pip install python-telegram-bot supabase</code></p>
          <p>3. Создайте бота через <a href="https://t.me/BotFather" target="_blank" className="text-primary underline">@BotFather</a></p>
          <p>4. Установите переменные окружения:</p>
          <pre className="rounded bg-secondary p-3 text-foreground overflow-x-auto">
{`BOT_TOKEN=ваш_токен_бота
SUPABASE_URL=https://mxqkxcbqinmlobopxuin.supabase.co
SUPABASE_KEY=ваш_service_role_key
ADMIN_IDS=ваш_telegram_id`}
          </pre>
          <p>5. Запустите: <code className="rounded bg-secondary px-1 py-0.5 text-foreground">python telegram_bot.py</code></p>
          <p className="mt-3 font-medium text-foreground">Команды бота:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code>/admin</code> — панель управления в боте</li>
            <li><code>/link название</code> — получить ссылку на фильм</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramBotAdmin;
