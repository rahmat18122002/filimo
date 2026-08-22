// Telegram bot: интихоби филм → иловаи эпизод бо MP4 мустақим ба анбори барнома.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY")!;
const BOT_PASSWORD = "18122002";
const PAGE_SIZE = 8;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const authHeaders = {
  Authorization: `Bearer ${LOVABLE_API_KEY}`,
  "X-Connection-Api-Key": TELEGRAM_API_KEY,
};

async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${GATEWAY}/${method}`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) {
    console.error(`telegram ${method} failed [${res.status}]:`, JSON.stringify(json));
  }
  return json;
}

const send = (chat_id: string, text: string, reply_markup?: unknown) =>
  tg("sendMessage", { chat_id, text, parse_mode: "HTML", reply_markup });

async function deriveSecret(key: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${key}`));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a: string | null, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function isAdmin(chatId: string) {
  const { data } = await supabase.from("telegram_admins").select("chat_id").eq("chat_id", chatId).maybeSingle();
  return !!data;
}

async function sendMovieList(chatId: string, page: number, messageId?: number) {
  const from = page * PAGE_SIZE;
  const { data: movies, count } = await supabase
    .from("movies")
    .select("id,title,year", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const rows = (movies ?? []).map((m) => [{
    text: `🎬 ${m.title} (${m.year})`,
    callback_data: `m:${m.id}`,
  }]);

  const nav: unknown[] = [];
  if (page > 0) nav.push({ text: "⬅️ Қафо", callback_data: `p:${page - 1}` });
  if ((count ?? 0) > from + PAGE_SIZE) nav.push({ text: "Пеш ➡️", callback_data: `p:${page + 1}` });
  if (nav.length) rows.push(nav as never);

  const payload = {
    chat_id: chatId,
    text: "🎬 <b>Филмро интихоб кунед:</b>",
    parse_mode: "HTML",
    reply_markup: { inline_keyboard: rows },
  };
  if (messageId) await tg("editMessageText", { ...payload, message_id: messageId });
  else await tg("sendMessage", payload);
}

async function showMovie(chatId: string, movieId: string) {
  const { data: movie } = await supabase.from("movies").select("id,title,year").eq("id", movieId).maybeSingle();
  if (!movie) return send(chatId, "❌ Филм ёфт нашуд.");

  const { data: eps } = await supabase
    .from("episodes").select("part_number,title,video_url").eq("movie_id", movieId).order("part_number");

  const list = (eps ?? []).length
    ? (eps ?? []).map((e) => `${e.video_url ? "✅" : "⚠️"} Қисми ${e.part_number} — ${e.title}`).join("\n")
    : "Ҳоло эпизод нест.";

  await supabase.from("telegram_sessions").upsert({
    chat_id: chatId, movie_id: movieId, step: "idle", updated_at: new Date().toISOString(),
  });

  return send(chatId, `🎬 <b>${movie.title}</b> (${movie.year})\n\n${list}`, {
    inline_keyboard: [
      [{ text: "➕ Иловаи эпизод", callback_data: `add:${movieId}` }],
      [{ text: "🔙 Рӯйхати филмҳо", callback_data: "p:0" }],
    ],
  });
}

async function handleVideo(chatId: string, msg: Record<string, any>) {
  const { data: session } = await supabase
    .from("telegram_sessions").select("movie_id,step").eq("chat_id", chatId).maybeSingle();

  if (!session?.movie_id || session.step !== "await_video") {
    return send(chatId, "ℹ️ Аввал филмро интихоб кунед ва «➕ Иловаи эпизод»-ро пахш кунед.\n/movies");
  }

  const file = msg.video ?? msg.document;
  const size = file.file_size ?? 0;
  await send(chatId, `⏳ Мегирам… (${(size / 1048576).toFixed(1)} МБ)`);

  const info = await tg("getFile", { file_id: file.file_id });
  if (!info?.ok) {
    return send(chatId, `❌ Гирифта натавонистам: <code>${info?.description ?? "номаълум"}</code>\n\n⚠️ Telegram Bot API танҳо файлҳои то <b>20 МБ</b>-ро медиҳад. Видеоро сиқиш кунед ё ба қисмҳо ҷудо кунед.`);
  }

  const filePath = info.result.file_path;
  const dl = await fetch(`${GATEWAY}/file/${filePath}`, { headers: authHeaders });
  if (!dl.ok) {
    const t = await dl.text();
    console.error("download failed", dl.status, t);
    return send(chatId, `❌ Зеркашӣ нашуд [${dl.status}].`);
  }
  const bytes = new Uint8Array(await dl.arrayBuffer());

  const safeName = (file.file_name ?? `${file.file_unique_id}.mp4`).replace(/[^\w.-]+/g, "_");
  const objectName = `${Date.now()}_${safeName.endsWith(".mp4") ? safeName : safeName + ".mp4"}`;

  const { error: upErr } = await supabase.storage.from("videos")
    .upload(objectName, bytes, { contentType: file.mime_type || "video/mp4", upsert: true });
  if (upErr) {
    console.error("storage upload failed", upErr);
    return send(chatId, `❌ Ба анбор бор нашуд: ${upErr.message}`);
  }

  const { data: last } = await supabase
    .from("episodes").select("part_number").eq("movie_id", session.movie_id)
    .order("part_number", { ascending: false }).limit(1).maybeSingle();
  const part = (last?.part_number ?? 0) + 1;

  const { error: insErr } = await supabase.from("episodes").insert({
    movie_id: session.movie_id,
    part_number: part,
    title: msg.caption?.trim() || `Қисми ${part}`,
    video_url: `storage:${objectName}`,
    is_free: false,
  });
  if (insErr) {
    console.error("episode insert failed", insErr);
    return send(chatId, `❌ Сабт нашуд: ${insErr.message}`);
  }

  await supabase.from("telegram_sessions")
    .update({ step: "idle", updated_at: new Date().toISOString() }).eq("chat_id", chatId);

  return send(chatId, `✅ Тайёр! <b>Қисми ${part}</b> ба барнома илова шуд ва омодаи тамошост.`, {
    inline_keyboard: [
      [{ text: "➕ Боз як эпизод", callback_data: `add:${session.movie_id}` }],
      [{ text: "🔙 Рӯйхати филмҳо", callback_data: "p:0" }],
    ],
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expected = await deriveSecret(TELEGRAM_API_KEY);
  if (!safeEqual(req.headers.get("X-Telegram-Bot-Api-Secret-Token"), expected)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = await req.json();

    // ─── Callback tugmaho ───
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = String(cq.message.chat.id);
      await tg("answerCallbackQuery", { callback_query_id: cq.id });
      if (!(await isAdmin(chatId))) return new Response("ok");

      const data: string = cq.data ?? "";
      if (data.startsWith("p:")) await sendMovieList(chatId, Number(data.slice(2)), cq.message.message_id);
      else if (data.startsWith("m:")) await showMovie(chatId, data.slice(2));
      else if (data.startsWith("add:")) {
        await supabase.from("telegram_sessions").upsert({
          chat_id: chatId, movie_id: data.slice(4), step: "await_video", updated_at: new Date().toISOString(),
        });
        await send(chatId, "📤 Акнун <b>файли видео (MP4)</b>-ро фиристед.\nМатни зери видео номи қисм мешавад.\n\n⚠️ Ҳаҷм то 20 МБ (маҳдудияти Telegram).");
      }
      return new Response("ok");
    }

    const msg = update.message ?? update.channel_post;
    if (!msg) return new Response("ok");
    const chatId = String(msg.chat.id);
    const text: string = (msg.text ?? "").trim();

    if (!(await isAdmin(chatId))) {
      if (text === BOT_PASSWORD) {
        await supabase.from("telegram_admins").insert({ chat_id: chatId, username: msg.from?.username ?? null });
        await send(chatId, "✅ Хуш омадед! Шумо ҳамчун админ сабт шудед.");
        await sendMovieList(chatId, 0);
      } else {
        await send(chatId, "🔒 Барои идора парол фиристед.");
      }
      return new Response("ok");
    }

    if (msg.video || msg.document) {
      await handleVideo(chatId, msg);
      return new Response("ok");
    }

    if (text === "/start" || text === "/movies" || text === "/help") {
      await send(chatId, "🎬 <b>Филимо — админ бот</b>\nФилмро интихоб кунед, «➕ Иловаи эпизод»-ро пахш кунед ва видеоро фиристед.");
      await sendMovieList(chatId, 0);
      return new Response("ok");
    }

    await send(chatId, "Барои рӯйхати филмҳо: /movies");
    return new Response("ok");
  } catch (e) {
    console.error("webhook error", e);
    return new Response("ok");
  }
});
