/**
 * KarwanContext — fetches shipping caravans from the real backend API.
 *
 * Replaces the previous hardcoded SAMPLE_KARWANS + AsyncStorage-only approach.
 *
 * API endpoints used:
 *   GET  /api/karwan/                          → list karwans
 *   GET  /api/karwan/{id}/                     → single karwan detail
 *   POST /api/karwan/{id}/book/                → create a booking
 *   GET  /api/my-karwan-bookings/              → user's bookings
 *   POST /api/my-karwan-bookings/{id}/cancel/  → cancel a booking
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

import {
  ApiKarwan,
  ApiKarwanBooking,
  isApiEnabled,
  karwan as karwanApi,
} from "@/lib/api";

// Re-export types so screens can import them from here (backwards-compat)
export type Karwan = ApiKarwan;
export type KarwanBooking = ApiKarwanBooking;

interface KarwanContextType {
  karwans: Karwan[];
  bookings: KarwanBooking[];
  loading: boolean;
  bookingsLoading: boolean;
  error: string | null;
  /** Reload the karwan list from the API */
  refreshKarwans: () => Promise<void>;
  /** Reload the user's bookings from the API */
  refreshBookings: () => Promise<void>;
  /**
   * Book a slot on a karwan.
   * Returns the created booking on success, or null on failure.
   */
  addBooking: (params: {
    karwanId: string;
    animalId?: string;
    animalTitle: string;
    weightKg: number;
    pickupAddress?: string;
    contactPhone?: string;
    notes?: string;
  }) => Promise<KarwanBooking | null>;
  /**
   * Cancel one of the user's bookings.
   * Returns true on success.
   */
  cancelBooking: (bookingId: string) => Promise<boolean>;
}

const KarwanContext = createContext<KarwanContextType | null>(null);

export function KarwanProvider({ children }: { children: React.ReactNode }) {
  const [karwans, setKarwans] = useState<Karwan[]>([]);
  const [bookings, setBookings] = useState<KarwanBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent double-fetch on strict mode / fast refresh
  const fetchedRef = useRef(false);

  // -------------------------------------------------------------------------
  // Load karwans
  // -------------------------------------------------------------------------
  const refreshKarwans = useCallback(async () => {
    if (!isApiEnabled()) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await karwanApi.list({ ordering: "departure_date,-rating" });
      setKarwans(resp.results);
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to load karwans.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Load user's bookings
  // -------------------------------------------------------------------------
  const refreshBookings = useCallback(async () => {
    if (!isApiEnabled()) return;
    setBookingsLoading(true);
    try {
      const data = await karwanApi.myBookings();
      setBookings(data);
    } catch {
      // Silently ignore — user may not be logged in yet
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    refreshKarwans();
    refreshBookings();
  }, [refreshKarwans, refreshBookings]);

  // -------------------------------------------------------------------------
  // Book
  // -------------------------------------------------------------------------
  const addBooking = useCallback(
    async ({
      karwanId,
      animalId,
      animalTitle,
      weightKg,
      pickupAddress,
      contactPhone,
      notes,
    }: {
      karwanId: string;
      animalId?: string;
      animalTitle: string;
      weightKg: number;
      pickupAddress?: string;
      contactPhone?: string;
      notes?: string;
    }): Promise<KarwanBooking | null> => {
      if (!isApiEnabled()) {
        Alert.alert("Offline", "API not configured.");
        return null;
      }
      try {
        const booking = await karwanApi.book(karwanId, {
          animal_title: animalTitle,
          weight_kg: weightKg,
          ...(animalId ? { animal: animalId } : {}),
          pickup_address: pickupAddress ?? "",
          contact_phone: contactPhone ?? "",
          notes: notes ?? "",
        });
        // Optimistically add to bookings list
        setBookings((prev) => [booking, ...prev]);
        // Update the karwan's booked_kg in local state
        setKarwans((prev) =>
          prev.map((k) =>
            k.id === karwanId
              ? {
                  ...k,
                  booked_kg: k.booked_kg + weightKg,
                  available_kg: Math.max(0, k.available_kg - weightKg),
                }
              : k
          )
        );
        return booking;
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "Booking failed. Please try again.";
        Alert.alert("Booking Failed", msg);
        return null;
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------
  const cancelBooking = useCallback(
    async (bookingId: string): Promise<boolean> => {
      if (!isApiEnabled()) return false;
      try {
        const { booking: updated } = await karwanApi.cancelBooking(bookingId);
        // Update local state
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? updated : b))
        );
        // Restore karwan capacity
        const cancelled = bookings.find((b) => b.id === bookingId);
        if (cancelled) {
          setKarwans((prev) =>
            prev.map((k) =>
              k.id === cancelled.karwan
                ? {
                    ...k,
                    booked_kg: Math.max(0, k.booked_kg - cancelled.weight_kg),
                    available_kg: k.available_kg + cancelled.weight_kg,
                  }
                : k
            )
          );
        }
        return true;
      } catch (e: any) {
        const msg =
          e?.response?.data?.detail ||
          e?.message ||
          "Could not cancel booking.";
        Alert.alert("Cancel Failed", msg);
        return false;
      }
    },
    [bookings]
  );

  return (
    <KarwanContext.Provider
      value={{
        karwans,
        bookings,
        loading,
        bookingsLoading,
        error,
        refreshKarwans,
        refreshBookings,
        addBooking,
        cancelBooking,
      }}
    >
      {children}
    </KarwanContext.Provider>
  );
}

export function useKarwan() {
  const ctx = useContext(KarwanContext);
  if (!ctx) throw new Error("useKarwan must be used within KarwanProvider");
  return ctx;
}
