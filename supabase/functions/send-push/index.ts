// Send Web Push to all subscribed devices when a new movie is added.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, body, movie_id, poster } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read VAPID keys from app_settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["vapid_public_key", "vapid_private_key", "vapid_subject"]);

    const map: Record<string, string> = {};
    (settings || []).forEach((s: any) => (map[s.key] = s.value));

    if (!map.vapid_public_key || !map.vapid_private_key) {
      return new Response(JSON.stringify({ error: "VAPID keys missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      map.vapid_subject || "mailto:admin@filimo.app",
      map.vapid_public_key,
      map.vapid_private_key
    );

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth");

    const payload = JSON.stringify({
      title: title || "Новый фильм 🎬",
      body: body || "",
      movie_id: movie_id || null,
      poster: poster || null,
    });

    let sent = 0;
    let removed = 0;
    const tasks = (subs || []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err: any) {
        // 404/410 => subscription expired, delete it
        const code = err?.statusCode;
        if (code === 404 || code === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
          removed++;
        } else {
          console.error("push error", code, err?.body);
        }
      }
    });
    await Promise.all(tasks);

    return new Response(JSON.stringify({ ok: true, sent, removed, total: subs?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
