import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  registerForPushNotifications,
  unregisterPushToken,
} from "@/lib/notifications";
import {
  animals as animalsApi,
  apiErrorMessage,
  auth as authApi,
  coupons as couponsApi,
  favorites as favoritesApi,
  isApiEnabled,
  tokenStore,
  platformSettings as settingsApi,
  type ApiMyAd,
  type ApiPlatformSettings,
} from "@/lib/api";
import { mapAnimal, mapCoupon, mapUser } from "@/lib/mappers";

export type UserRole = "buyer" | "seller" | null;

export interface User {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  preferredLanguage?: "en" | "ur";
}

export interface CouponCode {
  id: string;
  sellerId: string;
  code: string;
  discount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AnimalListing {
  id: string;
  title: string;
  category: "goat" | "cow" | "sheep" | "camel" | "buffalo";
  animalProperty?: "khasi" | "andal";
  price: number;
  weight: number;
  age: string;
  breed: string;
  city: string;
  province?: string;
  district?: string;
  streetAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  images: string[];
  coverImageIndex?: number;
  keywords?: string[];
  seller: {
    id: string;
    name: string;
    phone: string;
    whatsapp: string;
    rating: number;
    totalSales: number;
  };
  status?: "draft" | "published" | "inactive" | "scheduled";
  createdAt: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  isFeatured?: boolean;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isApiConnected: boolean;
  bootstrapping: boolean;
  favorites: string[];
  listings: AnimalListing[];
  listingsLoading: boolean;
  coupons: CouponCode[];
  language: "en" | "ur";
  platformConfig: ApiPlatformSettings | null;
  // Auth
  loginWithCredentials: (
    phoneOrEmail: string,
    password: string
  ) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  registerWithCredentials: (payload: {
    phone: string;
    name: string;
    password: string;
    role: "buyer" | "seller";
  }) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  login: (user: User) => void; // legacy guest-mode entry
  logout: () => Promise<void>;
  refreshListings: () => Promise<void>;
  // Language
  setLanguage: (lang: "en" | "ur") => Promise<void>;
  // Favorites
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  // Listings
  addListing: (
    payload: {
      title: string;
      category: AnimalListing["category"];
      animalProperty?: AnimalListing["animalProperty"];
      price: number;
      weight: number;
      age: string;
      breed: string;
      city: string;
      province?: string;
      district?: string;
      streetAddress?: string;
      latitude?: number | null;
      longitude?: number | null;
      description: string;
      images?: string[];
      coverImageIndex?: number;
      keywords?: string[];
      phone: string;
      status?: "draft" | "published" | "scheduled";
      scheduledAt?: string | null;
    }
  ) => Promise<{ ok: true; listing: AnimalListing } | { ok: false; error: string }>;
  // My Ads
  myAds: ApiMyAd[];
  myAdsLoading: boolean;
  fetchMyAds: (status?: "draft" | "published" | "inactive" | "scheduled") => Promise<void>;
  publishAd: (id: string) => Promise<{ ok: boolean; error?: string }>;
  toggleAdStatus: (id: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAd: (id: string) => Promise<{ ok: boolean; error?: string }>;
  // Coupons
  addCoupon: (
    coupon: Omit<CouponCode, "id" | "createdAt">
  ) => Promise<{ ok: boolean; error?: string }>;
  updateCoupon: (
    id: string,
    updates: Partial<CouponCode>
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteCoupon: (id: string) => Promise<{ ok: boolean; error?: string }>;
  validateCoupon: (code: string, sellerId: string) => CouponCode | null;
  // Tasbih
  tasbihCount: number;
  setTasbihCount: (count: number) => void;
  currentPhrase: number;
  setCurrentPhrase: (idx: number) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const SAMPLE_LISTINGS: AnimalListing[] = [
  {
    id: "local-1",
    title: "Beetal Bakra - Premium Quality",
    category: "goat",
    price: 35000,
    weight: 35,
    age: "2 years",
    breed: "Beetal",
    city: "Karachi",
    description:
      "Healthy Beetal breed goat, well-fed and vaccinated. Perfect for Qurbani.",
    images: ["goat_featured"],
    seller: {
      id: "s1",
      name: "Muhammad Farhan",
      phone: "+923001234567",
      whatsapp: "+923001234567",
      rating: 4.8,
      totalSales: 23,
    },
    status: "published",
    createdAt: "2026-04-20",
    isFeatured: true,
  },
  {
    id: "local-2",
    title: "Sahiwal Cow - Excellent for Qurbani",
    category: "cow",
    price: 185000,
    weight: 450,
    age: "3 years",
    breed: "Sahiwal",
    city: "Lahore",
    description: "Beautiful Sahiwal cow, all vaccinations done.",
    images: ["cow_featured"],
    seller: {
      id: "s2",
      name: "Ali Hassan",
      phone: "+923111234567",
      whatsapp: "+923111234567",
      rating: 4.9,
      totalSales: 45,
    },
    status: "published",
    createdAt: "2026-04-19",
    isFeatured: true,
  },
  {
    id: "local-3",
    title: "Dumba Sheep - Pure White",
    category: "sheep",
    price: 42000,
    weight: 40,
    age: "18 months",
    breed: "Dumba",
    city: "Islamabad",
    description: "Pure white Dumba sheep with thick wool.",
    images: ["sheep_featured"],
    seller: {
      id: "s3",
      name: "Usman Khan",
      phone: "+923211234567",
      whatsapp: "+923211234567",
      rating: 4.7,
      totalSales: 18,
    },
    status: "published",
    createdAt: "2026-04-18",
    isFeatured: false,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [listings, setListings] = useState<AnimalListing[]>(SAMPLE_LISTINGS);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [myAds, setMyAds] = useState<ApiMyAd[]>([]);
  const [myAdsLoading, setMyAdsLoading] = useState(false);
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [tasbihCount, setTasbihCountState] = useState(0);
  const [currentPhrase, setCurrentPhraseState] = useState(0);
  const [language, setLanguageState] = useState<"en" | "ur">("en");
  const [platformConfig, setPlatformConfig] = useState<ApiPlatformSettings | null>(null);

  // ---------------- Loaders ----------------
  const refreshListings = useCallback(async () => {
    if (!isApiEnabled()) return;
    setListingsLoading(true);
    try {
      const apiList = await animalsApi.list();
      const mapped = apiList.map(mapAnimal);
      // Merge: API listings first, local samples appended for visual richness
      setListings([
        ...mapped,
        ...SAMPLE_LISTINGS.filter((l) => l.id.startsWith("local-")),
      ]);
    } catch (err) {
      console.warn("[animals.list] failed:", apiErrorMessage(err));
    } finally {
      setListingsLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!isApiEnabled()) return;
    try {
      const list = await favoritesApi.list();
      const ids = list
        .map((f) =>
          typeof f.animal === "string"
            ? f.animal
            : (f.animal as any)?.id ?? null
        )
        .filter(Boolean) as string[];
      setFavorites(ids);
      AsyncStorage.setItem("favorites", JSON.stringify(ids)).catch(() => {});
    } catch (err) {
      console.warn("[favorites.list] failed:", apiErrorMessage(err));
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    if (!isApiEnabled()) return;
    try {
      const list = await couponsApi.list();
      const mapped = list.map(mapCoupon);
      setCoupons(mapped);
      AsyncStorage.setItem("coupons", JSON.stringify(mapped)).catch(() => {});
    } catch (err) {
      // Non-staff users may get 403 if endpoint is seller-only — ignore quietly
      console.warn("[coupons.list] failed:", apiErrorMessage(err));
    }
  }, []);

  const loadPlatformConfig = useCallback(async () => {
    if (!isApiEnabled()) return;
    try {
      const config = await settingsApi.get();
      setPlatformConfig(config);
    } catch (err) {
      console.warn("[settings] failed:", apiErrorMessage(err));
    }
  }, []);

  // ---------------- Bootstrap ----------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [
          storedUser,
          storedFavorites,
          storedTasbih,
          storedPhrase,
          storedCoupons,
          storedLang,
        ] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("favorites"),
          AsyncStorage.getItem("tasbihCount"),
          AsyncStorage.getItem("currentPhrase"),
          AsyncStorage.getItem("coupons"),
          AsyncStorage.getItem("language"),
        ]);
        if (!cancelled) {
          if (storedUser) setUser(JSON.parse(storedUser));
          if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
          if (storedTasbih) setTasbihCountState(parseInt(storedTasbih, 10));
          if (storedPhrase) setCurrentPhraseState(parseInt(storedPhrase, 10));
          if (storedCoupons) setCoupons(JSON.parse(storedCoupons));
          if (storedLang) setLanguageState(storedLang as "en" | "ur");
        }
      } catch {}

      if (isApiEnabled()) {
        const access = await tokenStore.getAccess();
        if (access) {
          try {
            const me = await authApi.me();
            const mapped = mapUser(me);
            setUser(mapped);
            if (mapped.preferredLanguage) {
              setLanguageState(mapped.preferredLanguage);
            }
            AsyncStorage.setItem("user", JSON.stringify(mapped)).catch(
              () => {}
            );
            setIsApiConnected(true);
            await Promise.all([refreshListings(), loadFavorites(), loadCoupons(), loadPlatformConfig()]);
          } catch (err) {
            await tokenStore.clear();
          }
        } else {
          await refreshListings().catch(() => {});
        }
      }

      if (!cancelled) setBootstrapping(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshListings, loadFavorites, loadCoupons, loadPlatformConfig]);

  // ---------------- Auth ----------------
  const finalizeLogin = useCallback(
    async (newUser: User) => {
      setUser(newUser);
      setIsApiConnected(true);
      if (newUser.preferredLanguage) {
        setLanguageState(newUser.preferredLanguage);
        await AsyncStorage.setItem("language", newUser.preferredLanguage);
      }
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      registerForPushNotifications()
        .then((token) => {
          if (token)
            AsyncStorage.setItem("push_token", token).catch(() => {});
        })
        .catch(() => {});
      await Promise.all([refreshListings(), loadFavorites(), loadCoupons(), loadPlatformConfig()]);
    },
    [refreshListings, loadFavorites, loadCoupons, loadPlatformConfig]
  );

  const loginWithCredentials = useCallback(
    async (phoneOrEmail: string, password: string) => {
      if (!isApiEnabled()) {
        return { ok: false as const, error: "Backend not configured." };
      }
      try {
        const apiUser = await authApi.login(phoneOrEmail, password);
        const u = mapUser(apiUser);
        await finalizeLogin(u);
        return { ok: true as const, user: u };
      } catch (err) {
        return { ok: false as const, error: apiErrorMessage(err, "Invalid phone or password.") };
      }
    },
    [finalizeLogin]
  );

  const registerWithCredentials = useCallback(
    async (payload: {
      phone: string;
      name: string;
      password: string;
      role: "buyer" | "seller";
    }) => {
      if (!isApiEnabled()) {
        return { ok: false as const, error: "Backend not configured." };
      }
      try {
        const apiUser = await authApi.register(payload);
        const u = mapUser(apiUser);
        await finalizeLogin(u);
        return { ok: true as const, user: u };
      } catch (err) {
        return { ok: false as const, error: apiErrorMessage(err, "Registration failed.") };
      }
    },
    [finalizeLogin]
  );

  // Legacy guest entry — used by "Browse without signing in"
  const login = useCallback(async (newUser: User) => {
    setUser(newUser);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setIsApiConnected(false);
    setFavorites([]);
    setCoupons([]);
    const token = await AsyncStorage.getItem("push_token");
    if (token) {
      unregisterPushToken(token).catch(() => {});
    }
    await tokenStore.clear();
    await AsyncStorage.multiRemove(["user", "push_token", "favorites", "coupons", "language"]);
  }, []);

  // ---------------- Language ----------------
  const setLanguage = useCallback(
    async (lang: "en" | "ur") => {
      setLanguageState(lang);
      await AsyncStorage.setItem("language", lang);
      // Sync to backend
      if (isApiEnabled() && user) {
        try {
          await authApi.updateProfile(user.id, { preferred_language: lang });
          setUser((prev) => prev ? { ...prev, preferredLanguage: lang } : prev);
        } catch (err) {
          console.warn("[setLanguage] API sync failed:", apiErrorMessage(err));
        }
      }
    },
    [user]
  );

  // ---------------- Favorites ----------------
  const toggleFavorite = useCallback(
    async (id: string) => {
      // Optimistic update
      const prev = favorites;
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      setFavorites(next);
      AsyncStorage.setItem("favorites", JSON.stringify(next)).catch(() => {});

      if (isApiEnabled() && user) {
        try {
          await favoritesApi.toggle(id);
        } catch (err) {
          // revert on failure
          setFavorites(prev);
          AsyncStorage.setItem("favorites", JSON.stringify(prev)).catch(
            () => {}
          );
          console.warn("[favorites.toggle] failed:", apiErrorMessage(err));
        }
      }
    },
    [favorites, user]
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  // ---------------- Listings ----------------
  const addListing = useCallback<AppContextType["addListing"]>(
    async (payload) => {
      if (isApiEnabled() && user) {
        try {
          const created = await animalsApi.create({
            title: payload.title,
            category: payload.category,
            animal_property: payload.animalProperty,
            price: payload.price,
            weight: payload.weight,
            age: payload.age,
            breed: payload.breed,
            city: payload.city,
            province: payload.province,
            district: payload.district,
            street_address: payload.streetAddress,
            latitude: payload.latitude,
            longitude: payload.longitude,
            description: payload.description,
            images:
              payload.images && payload.images.length > 0
                ? payload.images
                : [`${payload.category}_featured`],
            cover_image_index: payload.coverImageIndex ?? 0,
            keywords: payload.keywords || [],
            status: payload.status || "published",
            scheduled_at: payload.scheduledAt || null,
          });
          const mapped = mapAnimal(created);
          setListings((prev) => [mapped, ...prev]);
          return { ok: true as const, listing: mapped };
        } catch (err) {
          // Surface the full server response so we can debug validation issues.
          const ax = err as any;
          console.error("[addListing] failed", {
            status: ax?.response?.status,
            url: ax?.config?.url,
            method: ax?.config?.method,
            requestData: ax?.config?.data,
            responseData: ax?.response?.data,
            message: ax?.message,
          });
          return { ok: false as const, error: apiErrorMessage(err, "Could not publish listing.") };
        }
      }
      // Local-only fallback
      const localListing: AnimalListing = {
        id: "local-" + Date.now().toString(),
        title: payload.title,
        category: payload.category,
        animalProperty: payload.animalProperty,
        price: payload.price,
        weight: payload.weight,
        age: payload.age,
        breed: payload.breed,
        city: payload.city,
        province: payload.province,
        district: payload.district,
        streetAddress: payload.streetAddress,
        latitude: payload.latitude,
        longitude: payload.longitude,
        description: payload.description,
        images: payload.images && payload.images.length > 0
          ? payload.images
          : [`${payload.category}_featured`],
        coverImageIndex: payload.coverImageIndex ?? 0,
        keywords: payload.keywords || [],
        seller: {
          id: user?.id || "me",
          name: user?.name || "You",
          phone: payload.phone,
          whatsapp: payload.phone,
          rating: 5.0,
          totalSales: 0,
        },
        status: payload.status || "published",
        createdAt: new Date().toISOString().split("T")[0],
        isFeatured: false,
      };
      setListings((prev) => [localListing, ...prev]);
      return { ok: true as const, listing: localListing };
    },
    [user]
  );

  // ---------------- My Ads ----------------
  const fetchMyAds = useCallback<AppContextType["fetchMyAds"]>(
    async (status) => {
      if (!isApiEnabled() || !user) {
        setMyAds([]);
        return;
      }
      setMyAdsLoading(true);
      try {
        const data = await animalsApi.myAds(status ? { status } : undefined);
        setMyAds(data);
      } catch (err) {
        console.warn("[animals.myAds] failed:", apiErrorMessage(err));
      } finally {
        setMyAdsLoading(false);
      }
    },
    [user]
  );

  const publishAd = useCallback<AppContextType["publishAd"]>(
    async (id) => {
      if (!isApiEnabled() || !user) {
        return { ok: false, error: "You must be signed in." };
      }
      try {
        const updated = await animalsApi.publish(id);
        setMyAds((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: updated.status ?? "published",
                  published_at: updated.published_at ?? a.published_at,
                  scheduled_at: updated.scheduled_at ?? a.scheduled_at,
                }
              : a
          )
        );
        const mapped = mapAnimal(updated);
        setListings((prev) => {
          const exists = prev.some((a) => a.id === id);
          return exists ? prev.map((a) => (a.id === id ? mapped : a)) : [mapped, ...prev];
        });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: apiErrorMessage(err, "Could not publish ad.") };
      }
    },
    [user]
  );

  const toggleAdStatus = useCallback<AppContextType["toggleAdStatus"]>(
    async (id) => {
      if (!isApiEnabled() || !user) {
        return { ok: false, error: "You must be signed in." };
      }
      try {
        const updated = await animalsApi.toggleStatus(id);
        setMyAds((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: updated.status ?? a.status } : a
          )
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: apiErrorMessage(err, "Could not update status.") };
      }
    },
    [user]
  );

  const deleteAd = useCallback<AppContextType["deleteAd"]>(
    async (id) => {
      if (!isApiEnabled() || !user) {
        return { ok: false, error: "You must be signed in." };
      }
      try {
        await animalsApi.delete(id);
        setMyAds((prev) => prev.filter((a) => a.id !== id));
        setListings((prev) => prev.filter((a) => a.id !== id));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: apiErrorMessage(err, "Could not delete ad.") };
      }
    },
    [user]
  );

  // ---------------- Coupons ----------------
  const addCoupon = useCallback<AppContextType["addCoupon"]>(
    async (coupon) => {
      if (isApiEnabled() && user) {
        try {
          const created = await couponsApi.create({
            code: coupon.code,
            discount: coupon.discount,
            is_active: coupon.isActive,
          });
          const mapped = mapCoupon(created);
          setCoupons((prev) => [...prev, mapped]);
          return { ok: true };
        } catch (err) {
          return { ok: false, error: apiErrorMessage(err, "Could not create coupon.") };
        }
      }
      const local: CouponCode = {
        ...coupon,
        id: "local-" + Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setCoupons((prev) => {
        const updated = [...prev, local];
        AsyncStorage.setItem("coupons", JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      return { ok: true };
    },
    [user]
  );

  const updateCoupon = useCallback<AppContextType["updateCoupon"]>(
    async (id, updates) => {
      // Optimistic
      setCoupons((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );
        AsyncStorage.setItem("coupons", JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      if (isApiEnabled() && user && !id.startsWith("local-")) {
        try {
          const apiPayload: any = {};
          if (updates.code !== undefined) apiPayload.code = updates.code;
          if (updates.discount !== undefined)
            apiPayload.discount = updates.discount;
          if (updates.isActive !== undefined)
            apiPayload.is_active = updates.isActive;
          await couponsApi.update(id, apiPayload);
        } catch (err) {
          return { ok: false, error: apiErrorMessage(err, "Update failed.") };
        }
      }
      return { ok: true };
    },
    [user]
  );

  const deleteCoupon = useCallback<AppContextType["deleteCoupon"]>(
    async (id) => {
      const prev = coupons;
      setCoupons((p) => {
        const updated = p.filter((c) => c.id !== id);
        AsyncStorage.setItem("coupons", JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      if (isApiEnabled() && user && !id.startsWith("local-")) {
        try {
          await couponsApi.delete(id);
        } catch (err) {
          setCoupons(prev);
          return { ok: false, error: apiErrorMessage(err, "Delete failed.") };
        }
      }
      return { ok: true };
    },
    [coupons, user]
  );

  const validateCoupon = useCallback(
    (code: string, sellerId: string): CouponCode | null => {
      const match = coupons.find(
        (c) =>
          c.code.toLowerCase() === code.toLowerCase() &&
          c.sellerId === sellerId &&
          c.isActive
      );
      return match ?? null;
    },
    [coupons]
  );

  const setTasbihCount = useCallback(async (count: number) => {
    setTasbihCountState(count);
    await AsyncStorage.setItem("tasbihCount", count.toString());
  }, []);

  const setCurrentPhrase = useCallback(async (idx: number) => {
    setCurrentPhraseState(idx);
    await AsyncStorage.setItem("currentPhrase", idx.toString());
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isApiConnected,
        bootstrapping,
        favorites,
        listings,
        listingsLoading,
        coupons,
        language,
        platformConfig,
        loginWithCredentials,
        registerWithCredentials,
        login,
        logout,
        refreshListings,
        setLanguage,
        toggleFavorite,
        isFavorite,
        addListing,
        myAds,
        myAdsLoading,
        fetchMyAds,
        publishAd,
        toggleAdStatus,
        deleteAd,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        validateCoupon,
        tasbihCount,
        setTasbihCount,
        currentPhrase,
        setCurrentPhrase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
