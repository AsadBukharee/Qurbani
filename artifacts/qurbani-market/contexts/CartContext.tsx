import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { type AnimalListing } from "@/contexts/AppContext";

export interface CartItem {
  listing: AnimalListing;
  addedAt: string;
  appliedCoupon?: { code: string; discount: number } | null;
  finalPrice: number;
}

export interface Purchase {
  id: string;
  listing: AnimalListing;
  finalPrice: number;
  status: "pending" | "confirmed" | "paid" | "cancelled";
  transactionId?: string;
  purchasedAt: string;
  invoiceNumber: string;
}

interface CartContextType {
  cartItems: CartItem[];
  purchases: Purchase[];
  cartCount: number;
  addToCart: (listing: AnimalListing, coupon?: { code: string; discount: number } | null) => void;
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;
  isInCart: (listingId: string) => boolean;
  checkout: (item: CartItem) => Purchase;
  addPurchase: (purchase: Purchase) => void;
  getPurchase: (id: string) => Purchase | undefined;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "qurbani_cart_v1";
const PURCHASES_KEY = "qurbani_purchases_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY).then((raw) => {
      if (raw) {
        try { setCartItems(JSON.parse(raw)); } catch {}
      }
    });
    AsyncStorage.getItem(PURCHASES_KEY).then((raw) => {
      if (raw) {
        try { setPurchases(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const persistCart = useCallback((items: CartItem[]) => {
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const persistPurchases = useCallback((list: Purchase[]) => {
    AsyncStorage.setItem(PURCHASES_KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const addToCart = useCallback((listing: AnimalListing, coupon?: { code: string; discount: number } | null) => {
    setCartItems((prev) => {
      if (prev.find((c) => c.listing.id === listing.id)) return prev;
      const finalPrice = coupon
        ? Math.round(listing.price * (1 - coupon.discount / 100))
        : listing.price;
      const updated = [
        ...prev,
        { listing, addedAt: new Date().toISOString(), appliedCoupon: coupon ?? null, finalPrice },
      ];
      persistCart(updated);
      return updated;
    });
  }, [persistCart]);

  const removeFromCart = useCallback((listingId: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((c) => c.listing.id !== listingId);
      persistCart(updated);
      return updated;
    });
  }, [persistCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    persistCart([]);
  }, [persistCart]);

  const isInCart = useCallback((listingId: string) => {
    return cartItems.some((c) => c.listing.id === listingId);
  }, [cartItems]);

  const checkout = useCallback((item: CartItem): Purchase => {
    const invoiceNumber = `QM-${Date.now().toString(36).toUpperCase()}`;
    const purchase: Purchase = {
      id: `pur-${Date.now().toString(36)}`,
      listing: item.listing,
      finalPrice: item.finalPrice,
      status: "pending",
      purchasedAt: new Date().toISOString(),
      invoiceNumber,
    };
    return purchase;
  }, []);

  const addPurchase = useCallback((purchase: Purchase) => {
    setPurchases((prev) => {
      const updated = [purchase, ...prev];
      persistPurchases(updated);
      return updated;
    });
  }, [persistPurchases]);

  const getPurchase = useCallback((id: string) => {
    return purchases.find((p) => p.id === id);
  }, [purchases]);

  return (
    <CartContext.Provider value={{
      cartItems,
      purchases,
      cartCount: cartItems.length,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
      checkout,
      addPurchase,
      getPurchase,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
