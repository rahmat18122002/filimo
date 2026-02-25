import { useState, useEffect } from "react";
import { autoRegister, type AppUser } from "@/lib/userStore";

export function useAutoRegister() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    autoRegister()
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, setUser };
}
