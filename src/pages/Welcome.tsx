import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Film, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { autoRegister } from "@/lib/userStore";

const Welcome = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);
    try {
      await autoRegister();
      navigate("/home");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
          КиноПоиск
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
