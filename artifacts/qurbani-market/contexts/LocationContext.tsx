/**
 * Holds the user's currently selected location (manually picked or via GPS).
 * Used by the home header pin and consumed across the app for default
 * filters in browse/karwan screens.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface UserLocation {
  city: string;
  district?: string;
  province?: string;
  address?: string;
  source: "gps" | "manual";
  lat?: number;
  lng?: number;
}

interface LocationContextType {
  location: UserLocation | null;
  setLocation: (loc: UserLocation | null) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<UserLocation | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("user_location").then((raw) => {
      if (raw) {
        try { setLocationState(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const setLocation = useCallback(async (loc: UserLocation | null) => {
    setLocationState(loc);
    if (loc) {
      await AsyncStorage.setItem("user_location", JSON.stringify(loc));
    } else {
      await AsyncStorage.removeItem("user_location");
    }
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
