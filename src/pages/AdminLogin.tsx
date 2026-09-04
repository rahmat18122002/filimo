import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ADMIN_PASSWORD, setAdminUnlocked } from "@/lib/adminAuth";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_PASSWORD) {
      setAdminUnlocked(true);
      navigate("/admin", { replace: true });
    } else {
      setMessage("Неверный пароль");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="пароль"
          autoComplete="current-password"
          className="bg-background border-border/40 text-foreground"
          autoFocus
        />
        {message && <p className="text-xs text-destructive">{message}</p>}
        <Button type="submit" className="w-full">
          Войти
        </Button>
      </form>
    </div>
  );
};

export default AdminLogin;
