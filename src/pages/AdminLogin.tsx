import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/gate` },
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setMessage("Неверный логин или пароль");
        setLoading(false);
        return;
      }
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (!uid) {
      setMessage("Подтвердите email и войдите снова");
      setLoading(false);
      return;
    }

    // First ever account becomes the administrator (blocked afterwards by RLS)
    await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin");

    setLoading(false);

    if (roles && roles.length > 0) {
      navigate("/admin");
    } else {
      await supabase.auth.signOut();
      setMessage("Нет доступа");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          autoComplete="username"
          className="bg-background border-border/40 text-foreground"
          autoFocus
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="пароль"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="bg-background border-border/40 text-foreground"
        />
        {message && <p className="text-xs text-destructive">{message}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "..." : mode === "signup" ? "Создать" : "Войти"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-xs text-muted-foreground"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}
        >
          {mode === "signin" ? "Создать аккаунт" : "У меня есть аккаунт"}
        </Button>
      </form>
    </div>
  );
};

export default AdminLogin;
