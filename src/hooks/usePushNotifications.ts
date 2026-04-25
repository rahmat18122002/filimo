import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/userStore";

const VAPID_PUBLIC_KEY =
  "BOoNqh2FmKnef4KSIjFnFbihzkXwmkTvanYLFYkZa12jvppSBNrkgPDtDAjlA4ZC0tRvsaHuETbhY0JZ89STQuo";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

let audioCtx: AudioContext | null = null;
function playBeep() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.45);
    if ("vibrate" in navigator) navigator.vibrate?.([200, 100, 200]);
  } catch {}
}

async function subscribePush() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;

    let permission = Notification.permission;
    if (permission === "default") permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json: any = sub.toJSON();
    const deviceId = getDeviceId();
    await supabase.from("push_subscriptions").upsert(
      {
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        device_id: deviceId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
  } catch (e) {
    console.warn("push subscribe failed", e);
  }
}

export function useNewMovieNotifications() {
  useEffect(() => {
    // Try push subscription (silent, after user interaction is best, but try once)
    subscribePush();
    const onClick = () => subscribePush();
    document.addEventListener("click", onClick, { once: true });

    // Local realtime: show toast + beep when a new movie appears
    const channel = supabase
      .channel("movies-new")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "movies" },
        (payload: any) => {
          const m = payload.new;
          playBeep();
          toast("Новый фильм 🎬", {
            description: m?.title || "",
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener("click", onClick);
      supabase.removeChannel(channel);
    };
  }, []);
}
