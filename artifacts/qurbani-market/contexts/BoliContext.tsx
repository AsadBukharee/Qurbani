import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { apiErrorMessage, boli as boliApi, isApiEnabled } from "@/lib/api";
import { mapBid, mapBoli } from "@/lib/mappers";

export type BoliStatus = "active" | "ended" | "sold" | "expired";

export interface BoliListing {
  id: string;
  animalTitle: string;
  category: "goat" | "cow" | "sheep" | "camel";
  imageKey: string;
  city: string;
  weight: string;
  age: string;
  breed: string;
  description: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  startingPrice: number;
  currentPrice: number;
  minIncrement: number;
  startTime: string;
  endTime: string;
  duration: 1 | 3 | 5 | 7;
  status: BoliStatus;
  totalBids: number;
  winnerId?: string;
  winnerName?: string;
}

export interface Bid {
  id: string;
  boliId: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: string;
}

function makeEndTime(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

const SAMPLE_BOLI: BoliListing[] = [
  {
    id: "local-b1",
    animalTitle: "Beetal Bakra – Show Grade",
    category: "goat",
    imageKey: "goat_featured",
    city: "Karachi",
    weight: "38 kg",
    age: "2.5 years",
    breed: "Beetal",
    description:
      "Premium Beetal breed goat, vaccinated and dewormed. Raised on natural grass.",
    sellerId: "s_demo1",
    sellerName: "Haji Farooq",
    sellerPhone: "+923001112233",
    startingPrice: 30000,
    currentPrice: 47500,
    minIncrement: 500,
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: makeEndTime(9.5),
    duration: 3,
    status: "active",
    totalBids: 12,
  },
  {
    id: "local-b2",
    animalTitle: "Sahiwal Cow – 7 Shares",
    category: "cow",
    imageKey: "cow_featured",
    city: "Lahore",
    weight: "480 kg",
    age: "3 years",
    breed: "Sahiwal",
    description: "Premium Sahiwal cow available for 7-share Qurbani bidding.",
    sellerId: "s_demo2",
    sellerName: "Chaudhry Imran",
    sellerPhone: "+923011234567",
    startingPrice: 150000,
    currentPrice: 193000,
    minIncrement: 500,
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: makeEndTime(38),
    duration: 5,
    status: "active",
    totalBids: 8,
  },
];

interface BoliContextType {
  boliListings: BoliListing[];
  bids: Bid[];
  loading: boolean;
  refresh: () => Promise<void>;
  refreshBids: (boliId: string) => Promise<void>;
  getBidsForBoli: (boliId: string) => Bid[];
  placeBid: (
    boliId: string,
    userId: string,
    userName: string,
    amount: number
  ) => Promise<{ success: boolean; error?: string }>;
  createBoli: (
    listing: Omit<
      BoliListing,
      "id" | "currentPrice" | "status" | "totalBids" | "startTime" | "endTime"
    >
  ) => Promise<{ ok: true; listing: BoliListing } | { ok: false; error: string }>;
  getBoliById: (id: string) => BoliListing | undefined;
}

const BoliContext = createContext<BoliContextType | null>(null);

function expireListings(listings: BoliListing[]): BoliListing[] {
  const now = Date.now();
  return listings.map((l) => {
    if (l.status !== "active") return l;
    const ended = new Date(l.endTime).getTime() <= now;
    if (!ended) return l;
    return { ...l, status: l.totalBids > 0 ? "sold" : "expired" };
  });
}

export function BoliProvider({ children }: { children: React.ReactNode }) {
  const [boliListings, setBoliListings] = useState<BoliListing[]>(() =>
    expireListings(SAMPLE_BOLI)
  );
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const bidLockRef = useRef<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!isApiEnabled()) return;
    setLoading(true);
    try {
      const list = await boliApi.list();
      const mapped = list.map(mapBoli);
      // API listings + local samples (so the auction UI is never empty for new users)
      setBoliListings([
        ...expireListings(mapped),
        ...SAMPLE_BOLI.map((s) =>
          // mark samples as not actively expirable competitors with API ones
          ({ ...s })
        ),
      ]);
      AsyncStorage.setItem(
        "boli_listings",
        JSON.stringify(mapped)
      ).catch(() => {});
    } catch (err) {
      console.warn("[boli.list] failed:", apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBids = useCallback(async (boliId: string) => {
    if (!isApiEnabled() || boliId.startsWith("local-")) return;
    try {
      const list = await boliApi.bids(boliId);
      const mapped = list.map((b) => mapBid(boliId, b));
      // Replace any existing bids for this auction
      setBids((prev) => [
        ...prev.filter((b) => b.boliId !== boliId),
        ...mapped,
      ]);
    } catch (err) {
      console.warn("[boli.bids] failed:", apiErrorMessage(err));
    }
  }, []);

  // Initial load + 30s polling for live auctions
  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      refresh();
      // Also re-expire any local-only listings
      setBoliListings((prev) => {
        const updated = expireListings(prev);
        return updated.some((l, i) => l.status !== prev[i].status)
          ? updated
          : prev;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const getBidsForBoli = useCallback(
    (boliId: string) =>
      bids.filter((b) => b.boliId === boliId).sort((a, b) => b.amount - a.amount),
    [bids]
  );

  const placeBid = useCallback(
    async (
      boliId: string,
      userId: string,
      userName: string,
      amount: number
    ): Promise<{ success: boolean; error?: string }> => {
      if (bidLockRef.current.has(boliId)) {
        return {
          success: false,
          error: "Another bid is being processed. Please wait.",
        };
      }
      bidLockRef.current.add(boliId);

      try {
        const listing = boliListings.find((l) => l.id === boliId);
        if (!listing) {
          return { success: false, error: "Listing not found." };
        }
        if (listing.status !== "active") {
          return { success: false, error: "This auction has ended." };
        }
        if (new Date(listing.endTime).getTime() <= Date.now()) {
          return { success: false, error: "This auction has expired." };
        }
        if (listing.sellerId === userId) {
          return {
            success: false,
            error: "You cannot bid on your own listing.",
          };
        }
        const minRequired = listing.currentPrice + listing.minIncrement;
        if (amount < minRequired) {
          return {
            success: false,
            error: `Minimum bid is Rs. ${minRequired.toLocaleString()}.`,
          };
        }

        // API path
        if (isApiEnabled() && !boliId.startsWith("local-")) {
          try {
            await boliApi.bid(boliId, amount);
            // Refresh detail + bids list
            try {
              const detail = await boliApi.retrieve(boliId);
              const mapped = mapBoli(detail);
              setBoliListings((prev) =>
                prev.map((l) => (l.id === boliId ? mapped : l))
              );
            } catch {}
            refreshBids(boliId).catch(() => {});
            return { success: true };
          } catch (err) {
            return { success: false, error: apiErrorMessage(err, "Bid failed.") };
          }
        }

        // Local-only path (sample listings)
        const newListing: BoliListing = {
          ...listing,
          currentPrice: amount,
          totalBids: listing.totalBids + 1,
        };
        setBoliListings((prev) =>
          prev.map((l) => (l.id === boliId ? newListing : l))
        );
        const newBid: Bid = {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
          boliId,
          userId,
          userName,
          amount,
          timestamp: new Date().toISOString(),
        };
        setBids((prev) => [newBid, ...prev]);
        return { success: true };
      } finally {
        bidLockRef.current.delete(boliId);
      }
    },
    [boliListings, refreshBids]
  );

  const createBoli = useCallback<BoliContextType["createBoli"]>(
    async (data) => {
      if (isApiEnabled()) {
        try {
          const created = await boliApi.create({
            animal_title: data.animalTitle,
            category: data.category,
            image_key: data.imageKey,
            city: data.city,
            weight: data.weight,
            age: data.age,
            breed: data.breed,
            description: data.description,
            starting_price: data.startingPrice,
            min_increment: data.minIncrement,
            duration: data.duration,
          });
          const mapped = mapBoli(created);
          setBoliListings((prev) => [mapped, ...prev]);
          return { ok: true as const, listing: mapped };
        } catch (err) {
          return { ok: false as const, error: apiErrorMessage(err, "Could not create auction.") };
        }
      }

      // Local fallback
      const now = new Date();
      const endTime = new Date(
        now.getTime() + data.duration * 24 * 60 * 60 * 1000
      ).toISOString();
      const newListing: BoliListing = {
        ...data,
        id: "local-b_" + Date.now().toString(),
        currentPrice: data.startingPrice,
        status: "active",
        totalBids: 0,
        startTime: now.toISOString(),
        endTime,
      };
      setBoliListings((prev) => [newListing, ...prev]);
      return { ok: true as const, listing: newListing };
    },
    []
  );

  const getBoliById = useCallback(
    (id: string) => boliListings.find((l) => l.id === id),
    [boliListings]
  );

  return (
    <BoliContext.Provider
      value={{
        boliListings,
        bids,
        loading,
        refresh,
        refreshBids,
        getBidsForBoli,
        placeBid,
        createBoli,
        getBoliById,
      }}
    >
      {children}
    </BoliContext.Provider>
  );
}

export function useBoli() {
  const ctx = useContext(BoliContext);
  if (!ctx) throw new Error("useBoli must be used within BoliProvider");
  return ctx;
}
