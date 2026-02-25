import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ADMIN_PASSWORD = "18122002";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "1");
      navigate("/admin");
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <Input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="admin"
          className={`bg-background border-background text-background placeholder:text-background/20 focus:border-border focus:text-foreground focus:placeholder:text-muted-foreground transition-colors ${error ? "border-destructive" : ""}`}
          autoFocus
        />
        <Button type="submit" variant="ghost" className="w-full text-background hover:text-foreground transition-colors">
          →
        </Button>
      </form>
    </div>
  );
};

export default AdminLogin;
