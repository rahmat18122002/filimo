import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { autoRegister, getCurrentUser } from "@/lib/userStore";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const Welcome = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [appName, setAppName] = useState("Filimo");
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        setChecking(false);
      }
    });
    supabase.from("app_settings").select("*").eq("key", "app_name").single().then(({ data }) => {
      if (data) setAppName((data as any).value || "Filimo");
    });
  }, [navigate]);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await autoRegister();
      navigate("/home", { replace: true });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 shadow-glow">
          <Film className="h-10 w-10 text-primary" />
        </div>
        <h1
          className="text-3xl font-bold text-foreground sm:text-4xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {appName}
        </h1>
        <p className="mt-3 max-w-xs text-muted-foreground">
          Лучшие фильмы и сериалы — всё в одном приложении
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10"
        >
          <Button
            size="lg"
            onClick={handleRegister}
            disabled={loading}
            className="gap-2 rounded-xl px-8 text-base"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <UserPlus className="h-5 w-5" />
            )}
            Войти в приложение
          </Button>
        </motion.div>

        <p className="mt-4 text-xs text-muted-foreground/60">
          Регистрация автоматическая — просто нажмите кнопку
        </p>
      </motion.div>
    </div>
  );
};

export default Welcome;
