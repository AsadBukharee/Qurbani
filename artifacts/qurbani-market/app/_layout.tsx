import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { NotoNastaliqUrdu_400Regular } from "@expo-google-fonts/noto-nastaliq-urdu";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Surface uncaught JS errors as alerts on device so we can read them without adb.
if (typeof ErrorUtils !== "undefined") {
  const previousHandler = ErrorUtils.getGlobalHandler?.();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    try {
      console.error("[GlobalError]", isFatal ? "FATAL" : "non-fatal", error?.message, error?.stack);
    } catch {}
    previousHandler?.(error, isFatal);
  });
}
LogBox.ignoreLogs(["Sending `onAnimatedValueUpdate`"]);

// Explicitly require vector icon fonts so they bundle correctly for Android
const FeatherFont = require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf");
const MaterialFont = require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf");

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";
import { CartProvider } from "@/contexts/CartContext";
import { BoliProvider } from "@/contexts/BoliContext";
import { KarwanProvider } from "@/contexts/KarwanContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { addNotificationListener } from "@/lib/notifications";
import { VideoSplash } from "@/components/VideoSplash";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="auth/login"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="animal/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="boli/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="boli/create"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="wallet/index"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="seller/settings"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="karwan/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="wishlist"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="sell"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="auth/language-select"
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="my-ads/index"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="my-ads/create"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="chat/index"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="notifications"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="cart/index"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="purchases/index"
        options={{ headerShown: false, animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="invoice/[id]"
        options={{ headerShown: false, animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

function AppContent() {
  const router = useRouter();

  useEffect(() => {
    // This listener fires whenever a user taps on or interacts with a notification.
    // Wrapped in try/catch: push notifications were removed from Expo Go in SDK 53+.
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = addNotificationListener(
        (n) => {
          // Foreground receipt logic (e.g. show an in-app toast or update unread count)
          console.log("[Push] Received in foreground:", n.request.content.title);
        },
        (response) => {
          // Deep link logic when tapping notification
          const data = response.notification.request.content.data as any;
          console.log("[Push] User tapped notification:", data);

          if (data?.type === "chat" && data?.room_id) {
            router.push({
              pathname: "/chat/[id]",
              params: { id: String(data.room_id) },
            });
          } else if (
            (data?.type === "new_bid" || data?.type === "outbid") &&
            data?.boli_id
          ) {
            router.push({
              pathname: "/boli/[id]",
              params: { id: String(data.boli_id) },
            });
          }
        }
      );
    } catch (e) {
      console.warn("[Push] Notification listener setup failed (Expo Go?):", e);
    }
    return () => unsubscribe?.();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoNastaliqUrdu_400Regular,
    // Explicitly bundle icon fonts for native (Android/iOS) so Expo Go
    // registers them correctly. Skipped on web where CSS handles fonts.
    ...(Platform.OS !== "web"
      ? { Feather: FeatherFont, MaterialIcons: MaterialFont }
      : {}),
  });

  // Show the video splash on every platform — including web — so the
  // user sees one continuous splash experience.
  const [showVideo, setShowVideo] = useState(true);

  // Failsafe: never block longer than 2.5s on font loading. Some networks
  // slow Google Fonts enough that fontfaceobserver throws a "timeout
  // exceeded" rejection — we treat that as graceful and render anyway.
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceShow(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || forceShow) {
      if (fontError) {
        console.warn("[Fonts] Load error (continuing with fallback):", fontError);
      }
      // Keep native splash screen until fonts are ready and video is about to start
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, forceShow]);

  // Globally swallow the fontfaceobserver "ms timeout exceeded" rejection
  // so it doesn't trigger the red-box error overlay on web. No-op on native
  // (window.addEventListener doesn't exist on React Native).
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    const handler = (e: PromiseRejectionEvent) => {
      const msg = String(e?.reason?.message ?? e?.reason ?? "");
      if (/timeout exceeded/i.test(msg)) {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  if (!fontsLoaded && !fontError && !forceShow) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <AppProvider>
              <CartProvider>
                <LocationProvider>
                  <KarwanProvider>
                    <BoliProvider>
                      {showVideo ? (
                        <VideoSplash onFinish={() => setShowVideo(false)} />
                      ) : (
                        <AppContent />
                      )}
                    </BoliProvider>
                  </KarwanProvider>
                </LocationProvider>
              </CartProvider>
            </AppProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
