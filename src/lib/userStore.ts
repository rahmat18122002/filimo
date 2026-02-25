import { supabase } from "@/integrations/supabase/client";

const DEVICE_KEY = "kino_device_id";

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export interface AppUser {
  id: string;
  device_id: string;
  display_name: string | null;
  is_vip: boolean;
  vip_until: string | null;
  created_at: string;
}

export async function autoRegister(): Promise<AppUser> {
  const deviceId = getDeviceId();
  
  // Check if already registered
  const { data: existing } = await supabase
    .from("app_users")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  if (existing) return existing as AppUser;

  // Register new user
  const { data: newUser, error } = await supabase
    .from("app_users")
    .insert({ device_id: deviceId, display_name: `Гость_${deviceId.slice(0, 6)}` })
    .select()
    .single();

  if (error) throw error;
  return newUser as AppUser;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) return null;
  
  const { data } = await supabase
    .from("app_users")
    .select("*")
    .eq("device_id", deviceId)
    .single();

  return (data as AppUser) || null;
}

export function isVip(user: AppUser | null): boolean {
  if (!user) return false;
  if (!user.is_vip) return false;
  if (user.vip_until && new Date(user.vip_until) < new Date()) return false;
  return true;
}
