export const ADMIN_PASSWORD = "18122002";
const KEY = "kino_admin_unlocked";

export function setAdminUnlocked(value: boolean) {
  if (value) localStorage.setItem(KEY, "1");
  else localStorage.removeItem(KEY);
}

export function isAdminUnlocked(): boolean {
  return localStorage.getItem(KEY) === "1";
}
