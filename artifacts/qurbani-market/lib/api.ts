/**
 * API client for the Qurbani Market Django REST backend.
 *
 * The backend URL is hardcoded below — no .env needed.
 * Tokens returned by the backend are Fernet-encrypted blobs — we treat
 * them as opaque strings and pass them through as Bearer tokens.
 *
 * All resource IDs are hashid-encoded strings (e.g. "kR8xY3pQ").
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";

export const API_URL = "https://qbni.fosterhartley.uk/api";

/**
 * Normalize a Pakistani phone number to E.164 (`+92XXXXXXXXXX`).
 *
 * Handles the common ways users type phone numbers and strips leading
 * zeros that appear right after the country code. Backend rejects
 * anything else.
 *
 * Examples:
 *   "03001234567"       -> "+923001234567"
 *   "3001234567"        -> "+923001234567"
 *   "+9203001234567"    -> "+923001234567"  (drops the 0 after +92)
 *   "+923001234567"     -> "+923001234567"
 *   "00923001234567"    -> "+923001234567"
 *   "  +92 (300) 123-4567 " -> "+923001234567"
 */
export function normalizePhone(input: string): string {
  if (!input) return "";
  // Strip whitespace and common separators
  let s = input.trim().replace(/[\s()\-.]/g, "");
  // Convert international 00 prefix to +
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (!s.startsWith("+")) {
    // No country code typed — assume Pakistan, drop any leading zeros.
    s = "+92" + s.replace(/^0+/, "");
  } else {
    // Has explicit country code — drop any leading zeros that
    // appear right after it (e.g. +9203... -> +923...).
    s = s.replace(/^(\+\d{1,3})0+/, "$1");
  }
  // Final sweep: keep the + and digits only
  return "+" + s.slice(1).replace(/\D/g, "");
}

const ACCESS_KEY = "auth_access";
const REFRESH_KEY = "auth_refresh";

export const tokenStore = {
  async getAccess() {
    return AsyncStorage.getItem(ACCESS_KEY);
  },
  async getRefresh() {
    return AsyncStorage.getItem(REFRESH_KEY);
  },
  async set(access: string, refresh: string) {
    await AsyncStorage.multiSet([
      [ACCESS_KEY, access],
      [REFRESH_KEY, refresh],
    ]);
  },
  async clear() {
    await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  },
};

export const isApiEnabled = () => !!API_URL;

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStore.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const refresh = await tokenStore.getRefresh();
      if (!refresh) return null;
      const resp = await axios.post(
        `${API_URL}/auth/refresh/`,
        { refresh },
        { timeout: 15000 },
      );
      const access = resp.data.access as string;
      await AsyncStorage.setItem(ACCESS_KEY, access);
      return access;
    } catch {
      await tokenStore.clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };
    if (
      err.response?.status === 401 &&
      original &&
      !original._retried &&
      !original.url?.includes("/auth/refresh/")
    ) {
      original._retried = true;
      const newAccess = await refreshAccessToken();
      if (newAccess && original.headers) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      }
    }
    return Promise.reject(err);
  },
);

// Helper: pull a human-readable error message out of an axios error
export function apiErrorMessage(
  err: unknown,
  fallback = "Request failed",
): string {
  const e = err as AxiosError<any>;
  const data = e?.response?.data;
  if (typeof data === "string") return data;
  if (data?.detail) return String(data.detail);
  if (data && typeof data === "object") {
    const first = Object.entries(data)[0];
    if (first) {
      const [field, val] = first;
      const msg = Array.isArray(val) ? val[0] : val;
      return `${field}: ${msg}`;
    }
  }
  return e?.message || fallback;
}

// ---------------------------------------------------------------------------
// Backend response types
// ---------------------------------------------------------------------------

export interface ApiUser {
  id: string;
  phone: string;
  name: string;
  role: "buyer" | "seller" | "superadmin";
  avatar?: string | null;
  wallet_balance?: string;
  preferred_language?: string;
}

export interface ApiAnimal {
  id: string;
  title: string;
  category: "goat" | "cow" | "sheep" | "camel" | "buffalo";
  animal_property?: "khasi" | "andal" | null;
  price: number;
  weight: string;
  age: string;
  breed: string;
  city: string;
  province?: string;
  district?: string;
  street_address?: string;
  latitude?: string | null;
  longitude?: string | null;
  description: string;
  images: string[];
  cover_image_index?: number;
  cover_image?: string | null;
  keywords?: string[];
  seller: { id: string; name: string; phone: string; role?: string };
  status?: "draft" | "published" | "inactive" | "scheduled";
  is_featured?: boolean;
  scheduled_at?: string | null;
  published_at?: string | null;
  ad_fee_paid?: string;
  created_at: string;
}

export interface ApiMyAd {
  id: string;
  title: string;
  category: string;
  price: number;
  city: string;
  images: string[];
  cover_image_index: number;
  cover_image: string | null;
  status: "draft" | "published" | "inactive" | "scheduled";
  is_featured: boolean;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

export interface ApiBoli {
  id: string;
  animal_title: string;
  category: "goat" | "cow" | "sheep" | "camel" | "buffalo";
  image_key?: string;
  city: string;
  weight: string;
  age: string;
  breed: string;
  description: string;
  starting_price: number;
  current_price: number;
  min_increment: number;
  duration: 1 | 3 | 5 | 7;
  start_time: string;
  end_time: string;
  status: "active" | "ended" | "sold" | "expired";
  total_bids: number;
  seller?: { id: string; name: string; phone: string };
  winner?: { id: string; name: string } | null;
}

export interface ApiBid {
  id: string;
  amount: number;
  created_at?: string;
  timestamp?: string;
  user?: { id: string; name: string };
}

export interface ApiCoupon {
  id: string;
  seller: string;
  code: string;
  discount: number;
  is_active: boolean;
  created_at?: string;
}

export interface ApiPlatformSettings {
  ad_price: string;
  free_ad_limit: number;
  buyer_percentage: string;
  seller_percentage: string;
}

// Generic "list endpoint" unwrap — supports DRF pagination shape `{results}`
function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.results)) return data.results as T[];
  return [];
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export const auth = {
  async register(payload: {
    phone: string;
    name: string;
    password: string;
    role?: "buyer" | "seller";
  }) {
    const { data } = await api.post("/auth/register/", payload);
    if (data.access && data.refresh) {
      await tokenStore.set(data.access, data.refresh);
    }
    return data.user as ApiUser;
  },
  async login(phoneOrEmail: string, password: string) {
    const { data } = await api.post("/auth/login/", {
      phone: phoneOrEmail,
      password,
    });
    await tokenStore.set(data.access, data.refresh);
    return data.user as ApiUser;
  },
  async me() {
    const { data } = await api.get("/auth/me/");
    return data as ApiUser;
  },
  async logout() {
    await tokenStore.clear();
  },
  async updateProfile(userId: string, payload: Record<string, any>) {
    const { data } = await api.patch(`/auth/users/${userId}/`, payload);
    return data as ApiUser;
  },
};

export const animals = {
  async list(params?: Record<string, string | number | boolean>) {
    const { data } = await api.get("/animals/", { params });
    return unwrap<ApiAnimal>(data);
  },
  async retrieve(id: string) {
    const { data } = await api.get(`/animals/${id}/`);
    return data as ApiAnimal;
  },
  async create(payload: {
    title: string;
    category: string;
    animal_property?: "khasi" | "andal";
    price: number;
    weight: number | string;
    age: string;
    breed: string;
    city: string;
    province?: string;
    district?: string;
    street_address?: string;
    latitude?: number | null;
    longitude?: number | null;
    description: string;
    images: string[];
    cover_image_index?: number;
    keywords?: string[];
    status?: "draft" | "published" | "scheduled";
    scheduled_at?: string | null;
  }) {
    const { data } = await api.post("/animals/", payload);
    return data as ApiAnimal;
  },
  async update(
    id: string,
    payload: Partial<{
      title: string;
      category: string;
      animal_property: "khasi" | "andal";
      price: number;
      weight: number | string;
      age: string;
      breed: string;
      city: string;
      province: string;
      district: string;
      street_address: string;
      latitude: number | null;
      longitude: number | null;
      description: string;
      images: string[];
      cover_image_index: number;
      keywords: string[];
      status: string;
      scheduled_at: string | null;
    }>,
  ) {
    const { data } = await api.patch(`/animals/${id}/`, payload);
    return data as ApiAnimal;
  },
  async delete(id: string) {
    await api.delete(`/animals/${id}/`);
  },
  async myAds(params?: { status?: string }) {
    const { data } = await api.get("/animals/my-ads/", { params });
    return data as ApiMyAd[];
  },
  async publish(id: string) {
    const { data } = await api.post(`/animals/${id}/publish/`);
    return data as ApiAnimal;
  },
  async toggleStatus(id: string) {
    const { data } = await api.post(`/animals/${id}/toggle-status/`);
    return data as ApiAnimal;
  },
  async upload(file: { uri: string; name: string; type: string }) {
    const formData = new FormData();
    // @ts-ignore - FormData expects a Blob but React Native handles it via object with uri
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    const token = await tokenStore.getAccess();
    const { data } = await api.post("/animals/upload/", formData, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });
    return data as { url: string; public_id: string; resource_type: string };
  },
};

export const coupons = {
  async list() {
    const { data } = await api.get("/coupons/");
    return unwrap<ApiCoupon>(data);
  },
  create: (payload: { code: string; discount: number; is_active: boolean }) =>
    api.post("/coupons/", payload).then((r) => r.data as ApiCoupon),
  update: (id: string, payload: Partial<ApiCoupon>) =>
    api.patch(`/coupons/${id}/`, payload).then((r) => r.data as ApiCoupon),
  delete: (id: string) => api.delete(`/coupons/${id}/`),
  validate: (code: string, sellerId: string) =>
    api
      .post("/coupons/validate/", { code, seller_id: sellerId })
      .then((r) => r.data as ApiCoupon),
};

export const boli = {
  async list(params?: Record<string, string | number>) {
    const { data } = await api.get("/boli/", { params });
    return unwrap<ApiBoli>(data);
  },
  retrieve: (id: string) =>
    api.get(`/boli/${id}/`).then((r) => r.data as ApiBoli),
  create: (payload: {
    animal_title: string;
    category: string;
    image_key?: string;
    city: string;
    weight: string;
    age: string;
    breed: string;
    description: string;
    starting_price: number;
    min_increment: number;
    duration: 1 | 3 | 5 | 7;
  }) => api.post("/boli/", payload).then((r) => r.data as ApiBoli),
  bid: (id: string, amount: number) =>
    api.post(`/boli/${id}/bid/`, { amount }).then((r) => r.data),
  async bids(id: string) {
    const { data } = await api.get(`/boli/${id}/bids/`);
    return unwrap<ApiBid>(data);
  },
};

export const favorites = {
  async list() {
    const { data } = await api.get("/favorites/");
    return unwrap<{ id: string; animal: string | ApiAnimal }>(data);
  },
  toggle: (animalId: string) =>
    api.post("/favorites/toggle/", { animal: animalId }).then(
      (r) =>
        r.data as {
          favorited: boolean;
          favorite: { id: string; animal: string } | null;
        },
    ),
};

export const chat = {
  rooms: () => api.get("/chat-rooms/").then((r) => r.data),
  open: (otherUserId: string, animalId?: string) =>
    api
      .post("/chat-rooms/open/", {
        other_user: otherUserId,
        ...(animalId ? { animal: animalId } : {}),
      })
      .then((r) => r.data),
  messages: (roomId: string) =>
    api.get(`/chat-rooms/${roomId}/messages/`).then((r) => r.data),
  send: (roomId: string, text: string) =>
    api.post(`/chat-rooms/${roomId}/messages/`, { text }).then((r) => r.data),
};

export const notifications = {
  list: () => api.get("/notifications/").then((r) => r.data),
  markAllRead: () =>
    api.post("/notifications/mark_all_read/").then((r) => r.data),
  markRead: (id: string) =>
    api.post(`/notifications/${id}/mark_read/`).then((r) => r.data),
};

export const pushTokens = {
  register: (expoToken: string, platform: string) =>
    api
      .post("/push-tokens/", { expo_token: expoToken, platform })
      .then((r) => r.data),
  unregister: (expoToken: string) =>
    api.delete("/push-tokens/", { data: { expo_token: expoToken } }),
};

export const platformSettings = {
  async get() {
    const { data } = await api.get("/settings/platform/");
    return data as ApiPlatformSettings;
  },
};

// ---------------------------------------------------------------------------
// Wallet & Payments
// ---------------------------------------------------------------------------

export interface ApiWallet {
  id: string;
  balance: string;
  user: string;
}

export interface ApiPaymentRequest {
  id: string;
  payment_receiver: string;
  amount: number;
  transaction_id: string;
  status: "pending" | "confirmed" | "paid" | "cancelled";
  created_at: string;
}

export const wallet = {
  async get(): Promise<ApiWallet> {
    const { data } = await api.get("/wallet/");
    return data as ApiWallet;
  },
  async listPaymentReceivers(): Promise<{ id: string; name: string; phone: string }[]> {
    const { data } = await api.get("/wallet/payment-receivers/");
    return Array.isArray(data) ? data : (data?.results ?? []);
  },
};

// ---------------------------------------------------------------------------
// Karwan (cattle transport caravans)
// ---------------------------------------------------------------------------

export interface ApiKarwan {
  id: string;
  operator_name: string;
  operator_phone: string;
  truck_name: string;
  origin: string;
  destination: string;
  departure_date: string;
  arrival_date: string;
  price_per_kg: number;
  capacity_kg: number;
  booked_kg: number;
  available_kg: number;
  truck_type: "open" | "covered" | "ac-covered";
  rating: string;
  total_trips: number;
  notes?: string;
  is_active: boolean;
  is_full: boolean;
  created_at: string;
}

export interface ApiKarwanBooking {
  id: string;
  karwan: string;
  karwan_detail: {
    id: string;
    operator_name: string;
    truck_name: string;
    origin: string;
    destination: string;
    departure_date: string;
    arrival_date: string;
    operator_phone: string;
    price_per_kg: number;
  };
  user: string;
  animal?: string | null;
  animal_title: string;
  weight_kg: number;
  total_cost: number;
  status: "pending" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  pickup_address?: string;
  contact_phone?: string;
  notes?: string;
  booked_at: string;
  updated_at: string;
}

export interface ApiKarwanListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiKarwan[];
}

export const karwan = {
  async list(params?: {
    origin?: string;
    destination?: string;
    departure_date?: string;
    truck_type?: "open" | "covered" | "ac-covered";
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<ApiKarwanListResponse> {
    const { data } = await api.get("/karwan/", { params });
    return data as ApiKarwanListResponse;
  },

  retrieve: (id: string) =>
    api.get(`/karwan/${id}/`).then((r) => r.data as ApiKarwan),

  book: (
    karwanId: string,
    payload: {
      animal_title: string;
      weight_kg: number;
      animal?: string;
      pickup_address?: string;
      contact_phone?: string;
      notes?: string;
    },
  ) =>
    api
      .post(`/karwan/${karwanId}/book/`, payload)
      .then((r) => r.data as ApiKarwanBooking),

  myBookings: (params?: { status?: string; page?: number }) =>
    api
      .get("/my-karwan-bookings/", { params })
      .then((r) => unwrap<ApiKarwanBooking>(r.data)),

  myBooking: (id: string) =>
    api
      .get(`/my-karwan-bookings/${id}/`)
      .then((r) => r.data as ApiKarwanBooking),

  cancelBooking: (id: string) =>
    api
      .post(`/my-karwan-bookings/${id}/cancel/`)
      .then((r) => r.data as { detail: string; booking: ApiKarwanBooking }),
};
