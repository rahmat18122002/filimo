import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "ru" | "en" | "tg" | "fa";

const LANG_KEY = "kino_lang";

const translations: Record<Lang, Record<string, string>> = {
  ru: {
    "app.subtitle": "Лучшие фильмы и сериалы — всё в одном приложении",
    "app.enter": "Войти в приложение",
    "app.auto_register": "Регистрация автоматическая — просто нажмите кнопку",
    "nav.home": "Главная",
    "nav.vip": "VIP",
    "nav.live": "Live",
    "nav.language": "Язык",
    "search.placeholder": "Поиск фильмов...",
    "movies.not_found": "Фильмы не найдены",
    "movies.all": "Все фильмы",
    "vip.only": "Только для VIP",
    "vip.buy": "Купите VIP для доступа к Live TV",
    "vip.title": "VIP подписка",
    "vip.days_left": "дн.",
    "share.copied": "Ссылка скопирована!",
    "share.title": "Поделиться",
    "share.text": "Смотри фильм:",
    "detail.back": "Назад",
    "detail.watch": "Смотреть",
    "detail.trailer": "Трейлер",
    "detail.episodes": "Серии",
    "detail.free": "Бесплатно",
    "detail.vip_only": "Только VIP",
    "detail.buy_vip": "Купить VIP",
    "footer.copyright": "© 2026 КиноПоиск — Каталог фильмов",
    "live.title": "Live TV",
    "live.back": "Назад",
    "live.no_access": "Нет доступа",
    "live.buy_vip": "Купите VIP для просмотра",
    "live.channels": "Каналы",
    "story.more": "Подробнее",
    "lang.ru": "Русский",
    "lang.en": "English",
    "lang.tg": "Тоҷикӣ",
    "lang.fa": "فارسی",
  },
  en: {
    "app.subtitle": "Best movies and series — all in one app",
    "app.enter": "Enter App",
    "app.auto_register": "Registration is automatic — just press the button",
    "nav.home": "Home",
    "nav.vip": "VIP",
    "nav.live": "Live",
    "nav.language": "Language",
    "search.placeholder": "Search movies...",
    "movies.not_found": "Movies not found",
    "movies.all": "All movies",
    "vip.only": "VIP only",
    "vip.buy": "Buy VIP to access Live TV",
    "vip.title": "VIP Subscription",
    "vip.days_left": "d.",
    "share.copied": "Link copied!",
    "share.title": "Share",
    "share.text": "Watch movie:",
    "detail.back": "Back",
    "detail.watch": "Watch",
    "detail.trailer": "Trailer",
    "detail.episodes": "Episodes",
    "detail.free": "Free",
    "detail.vip_only": "VIP only",
    "detail.buy_vip": "Buy VIP",
    "footer.copyright": "© 2026 KinoPoisk — Movie Catalog",
    "live.title": "Live TV",
    "live.back": "Back",
    "live.no_access": "No access",
    "live.buy_vip": "Buy VIP to watch",
    "live.channels": "Channels",
    "story.more": "More",
    "lang.ru": "Русский",
    "lang.en": "English",
    "lang.tg": "Тоҷикӣ",
    "lang.fa": "فارسی",
  },
  tg: {
    "app.subtitle": "Беҳтарин филмҳо ва сериалҳо — ҳама дар як барнома",
    "app.enter": "Ворид шавед",
    "app.auto_register": "Сабтнома худкор аст — танҳо тугмаро пахш кунед",
    "nav.home": "Асосӣ",
    "nav.vip": "VIP",
    "nav.live": "Live",
    "nav.language": "Забон",
    "search.placeholder": "Ҷустуҷӯи филмҳо...",
    "movies.not_found": "Филмҳо ёфт нашуданд",
    "movies.all": "Ҳама филмҳо",
    "vip.only": "Танҳо барои VIP",
    "vip.buy": "VIP харед барои дастрасӣ ба Live TV",
    "vip.title": "Обунаи VIP",
    "vip.days_left": "рӯз",
    "share.copied": "Истинод нусхабардорӣ шуд!",
    "share.title": "Мубодила",
    "share.text": "Филм тамошо кунед:",
    "detail.back": "Бозгашт",
    "detail.watch": "Тамошо",
    "detail.trailer": "Трейлер",
    "detail.episodes": "Қисматҳо",
    "detail.free": "Ройгон",
    "detail.vip_only": "Танҳо VIP",
    "detail.buy_vip": "VIP харед",
    "footer.copyright": "© 2026 КиноПоиск — Каталоги филмҳо",
    "live.title": "Live TV",
    "live.back": "Бозгашт",
    "live.no_access": "Дастрасӣ нест",
    "live.buy_vip": "VIP харед барои тамошо",
    "live.channels": "Каналҳо",
    "story.more": "Бештар",
    "lang.ru": "Русский",
    "lang.en": "English",
    "lang.tg": "Тоҷикӣ",
    "lang.fa": "فارسی",
  },
  fa: {
    "app.subtitle": "بهترین فیلم‌ها و سریال‌ها — همه در یک اپلیکیشن",
    "app.enter": "ورود به برنامه",
    "app.auto_register": "ثبت‌نام خودکار است — فقط دکمه را بزنید",
    "nav.home": "خانه",
    "nav.vip": "VIP",
    "nav.live": "Live",
    "nav.language": "زبان",
    "search.placeholder": "جستجوی فیلم‌ها...",
    "movies.not_found": "فیلمی یافت نشد",
    "movies.all": "همه فیلم‌ها",
    "vip.only": "فقط VIP",
    "vip.buy": "VIP بخرید برای دسترسی به Live TV",
    "vip.title": "اشتراک VIP",
    "vip.days_left": "روز",
    "share.copied": "لینک کپی شد!",
    "share.title": "اشتراک‌گذاری",
    "share.text": "فیلم تماشا کنید:",
    "detail.back": "بازگشت",
    "detail.watch": "تماشا",
    "detail.trailer": "تریلر",
    "detail.episodes": "قسمت‌ها",
    "detail.free": "رایگان",
    "detail.vip_only": "فقط VIP",
    "detail.buy_vip": "خرید VIP",
    "footer.copyright": "© 2026 کینوپویسک — کاتالوگ فیلم‌ها",
    "live.title": "Live TV",
    "live.back": "بازگشت",
    "live.no_access": "دسترسی ندارید",
    "live.buy_vip": "VIP بخرید برای تماشا",
    "live.channels": "کانال‌ها",
    "story.more": "بیشتر",
    "lang.ru": "Русский",
    "lang.en": "English",
    "lang.tg": "Тоҷикӣ",
    "lang.fa": "فارسی",
  },
};

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  lang: "ru",
  setLang: () => {},
  t: (k) => k,
  dir: "ltr",
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem(LANG_KEY) as Lang) || "ru";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations.ru[key] || key;
  };

  const dir = lang === "fa" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

// Helper to get a localized field from a DB row
// e.g. getLocalizedField(movie, "title", lang) checks title_en, title_tg, title_fa
export const getLocalizedField = (
  row: Record<string, any>,
  field: string,
  lang: Lang
): string => {
  if (lang === "ru") return row[field] || "";
  const localized = row[`${field}_${lang}`];
  return localized && localized.trim() ? localized : row[field] || "";
};

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", flag: "🇬🇧" },
];
