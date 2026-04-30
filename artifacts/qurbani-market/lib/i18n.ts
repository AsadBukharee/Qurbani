/**
 * Lightweight i18n for the Qurbani app.
 *
 * Usage:
 *   const t = useT();
 *   <Text>{t("home.featured")}</Text>
 *
 * To get an Urdu-aware text style (auto-applies the Nastaliq font and
 * right-to-left alignment when the user is in Urdu mode):
 *   const urduStyle = useUrduTextStyle();
 *   <Text style={[styles.title, urduStyle]}>{t("...")}</Text>
 *
 * Rendering English strings while in Urdu mode is fine — the helper just
 * keeps the default font for those. Adding a new string is just a matter
 * of adding a key to STRINGS below.
 */
import { useApp } from "@/contexts/AppContext";
import type { TextStyle } from "react-native";

export type Lang = "en" | "ur";

/**
 * The single source of truth for translatable strings. Add new keys here
 * and they become available to every screen via the `useT()` hook.
 *
 * If a key is missing in `ur`, the English value is used as a fallback,
 * so partial coverage is safe for production.
 */
export const STRINGS = {
  // ---------------- Tabs ----------------
  "tab.home": { en: "Home", ur: "مرکزی" },
  "tab.search": { en: "Search", ur: "تلاش" },
  "tab.boli": { en: "Boli", ur: "بولی" },
  "tab.karwan": { en: "Karwan", ur: "کارواں" },
  "tab.inbox": { en: "Inbox", ur: "پیغامات" },
  "tab.profile": { en: "Profile", ur: "پروفائل" },

  // ---------------- Common ----------------
  "common.save": { en: "Save", ur: "محفوظ کریں" },
  "common.cancel": { en: "Cancel", ur: "منسوخ" },
  "common.continue": { en: "Continue", ur: "جاری رکھیں" },
  "common.confirm": { en: "Confirm", ur: "تصدیق" },
  "common.search": { en: "Search", ur: "تلاش کریں" },
  "common.loading": { en: "Loading...", ur: "لوڈ ہو رہا ہے..." },
  "common.error": { en: "Error", ur: "خرابی" },
  "common.success": { en: "Success", ur: "کامیابی" },
  "common.retry": { en: "Retry", ur: "دوبارہ کوشش" },
  "common.close": { en: "Close", ur: "بند کریں" },

  // ---------------- Home ----------------
  "home.greeting": { en: "Salam, ", ur: "السلام علیکم، " },
  "home.searchPlaceholder": {
    en: "Search animals by city, breed...",
    ur: "شہر، نسل کے مطابق جانور تلاش کریں...",
  },
  "home.featured.eid.label": { en: "Eid ul-Adha 2026", ur: "عید الاضحی ۲۰۲۶" },
  "home.featured.eid.sub": {
    en: "Buy Qurbani Animals with Trust",
    ur: "اعتماد کے ساتھ قربانی کے جانور خریدیں",
  },
  "home.featured.karwan.label": { en: "Karwan", ur: "کارواں" },
  "home.featured.karwan.sub": {
    en: "Get Animal at your doorstep",
    ur: "جانور آپ کی دہلیز پر",
  },
  "home.featured.dumba.label": { en: "Dumba & Sheep", ur: "دنبہ اور بھیڑ" },
  "home.featured.dumba.sub": {
    en: "Authentic Breeds, Best Prices",
    ur: "اصلی نسلیں، بہترین قیمتیں",
  },
  "home.categories": { en: "Categories", ur: "اقسام" },
  "home.recentListings": { en: "Recent Listings", ur: "حالیہ اشتہارات" },
  "home.viewAll": { en: "View All", ur: "سب دیکھیں" },
  "home.activeBoli": { en: "Active Auctions", ur: "جاری بولیاں" },
  "home.setLocation": { en: "Set Location", ur: "مقام منتخب کریں" },
  "home.noListings": {
    en: "No listings yet",
    ur: "ابھی تک کوئی اشتہار نہیں",
  },

  // ---------------- Drawer ----------------
  "drawer.settings": { en: "Settings", ur: "ترتیبات" },
  "drawer.viewProfile": { en: "View Profile", ur: "پروفائل دیکھیں" },
  "drawer.language": { en: "Language", ur: "زبان" },
  "drawer.notifications": { en: "Notifications", ur: "اطلاعات" },
  "drawer.notifications.sub": { en: "View all alerts", ur: "تمام اطلاعات دیکھیں" },
  "drawer.wishlist": { en: "Wishlist", ur: "پسندیدہ" },
  "drawer.wishlist.sub": { en: "Your saved animals", ur: "محفوظ کردہ جانور" },
  "drawer.wallet": { en: "Wallet", ur: "بٹوہ" },
  "drawer.wallet.sub": { en: "Manage funds", ur: "رقم کا انتظام" },
  "drawer.darkTheme": { en: "Dark Theme", ur: "ڈارک تھیم" },
  "drawer.lightTheme": { en: "Light Theme", ur: "لائٹ تھیم" },
  "drawer.theme.sub": { en: "Tap to switch appearance", ur: "ظاہری شکل تبدیل کریں" },
  "drawer.myAds": { en: "My Ads", ur: "میرے اشتہارات" },
  "drawer.myAds.sub": { en: "Manage your listings", ur: "اپنے اشتہارات منظم کریں" },
  "drawer.signOut": { en: "Sign Out", ur: "سائن آؤٹ" },
  "drawer.signOut.confirm.title": {
    en: "Sign Out",
    ur: "سائن آؤٹ کریں",
  },
  "drawer.signOut.confirm.body": {
    en: "Are you sure you want to sign out?",
    ur: "کیا آپ واقعی سائن آؤٹ کرنا چاہتے ہیں؟",
  },
  "drawer.languageEnglish": { en: "Language: English", ur: "زبان: انگریزی" },
  "drawer.languageUrdu": { en: "Language: Urdu", ur: "زبان: اردو" },
  "drawer.tapToSwitch": { en: "Tap to switch", ur: "تبدیل کرنے کے لیے دبائیں" },
} as const;

export type StringKey = keyof typeof STRINGS;

/**
 * Pure translation function. Falls back to English when an Urdu value is
 * missing, and falls back to the key itself if neither exists (so a typo
 * is visible during development without crashing the app).
 */
export function translate(key: StringKey | string, lang: Lang): string {
  const entry = (STRINGS as Record<string, { en: string; ur?: string }>)[key];
  if (!entry) return key;
  if (lang === "ur" && entry.ur) return entry.ur;
  return entry.en;
}

/**
 * Hook that returns a `t(key)` function bound to the current language
 * from AppContext. Re-renders consumers when the language changes.
 */
export function useT(): (key: StringKey | string) => string {
  const { language } = useApp();
  return (key) => translate(key, language);
}

/**
 * Returns the active language without forcing the consumer to subscribe
 * to the whole AppContext shape.
 */
export function useLang(): Lang {
  const { language } = useApp();
  return language;
}

/**
 * Style mixin that switches the font + writing direction whenever the
 * user is in Urdu mode. Spread into any Text style:
 *
 *   const urdu = useUrduTextStyle();
 *   <Text style={[styles.title, urdu]}>...</Text>
 */
export function useUrduTextStyle(extra?: { lineHeight?: number }): TextStyle {
  const lang = useLang();
  if (lang !== "ur") return {};
  return {
    fontFamily: "NotoNastaliqUrdu_400Regular",
    writingDirection: "rtl",
    textAlign: "right",
    // Nastaliq glyphs are tall — give a generous line-height by default.
    lineHeight: extra?.lineHeight ?? 28,
  };
}

/**
 * Standalone helper for places where hooks aren't available (e.g. inside
 * StyleSheet.create or static option objects). Accepts the language
 * explicitly.
 */
export function urduTextStyle(lang: Lang): TextStyle {
  if (lang !== "ur") return {};
  return {
    fontFamily: "NotoNastaliqUrdu_400Regular",
    writingDirection: "rtl",
    textAlign: "right",
  };
}
