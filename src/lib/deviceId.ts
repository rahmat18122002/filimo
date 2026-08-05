import { supabase } from "@/integrations/supabase/client";

const DEVICE_KEY = "kino_device_id";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/**
 * The database identifies anonymous visitors by the `x-device-id` request
 * header (used by row-level security to scope carts, orders, notifications,
 * push subscriptions and payments to the owning device).
 */
export function attachDeviceHeader() {
  const deviceId = getDeviceId();
  const setHeader = (holder: unknown) => {
    const headers = (holder as { headers?: unknown } | undefined)?.headers;
    if (!headers) return;
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
      headers.set("x-device-id", deviceId);
    } else {
      (headers as Record<string, string>)["x-device-id"] = deviceId;
    }
  };
  const client = supabase as unknown as Record<string, unknown>;
  setHeader(client);
  setHeader(client.rest);
  setHeader(client.storage);
}

