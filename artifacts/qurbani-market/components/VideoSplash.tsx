/**
 * VideoSplash — cinematic splash screen.
 *
 * expo-video requires a **development build** (custom native module).
 * In Expo Go the native VideoPlayer constructor signature may differ,
 * so we fall back to a simple animated brand splash if the video player
 * fails to initialize.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface VideoSplashProps {
  onFinish: () => void;
}

/**
 * Attempts to render the video splash. If expo-video is unavailable or
 * throws (common in Expo Go), we render a branded animated fallback.
 */
export function VideoSplash({ onFinish }: VideoSplashProps) {
  const [useVideo, setUseVideo] = useState(false);

  // Try to load expo-video dynamically so it doesn't crash at import time
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Dynamic import — won't crash the module graph if expo-video is missing
        const mod: any = await import("expo-video");
        if (mounted && typeof mod?.useVideoPlayer === "function" && mod?.VideoView) {
          setUseVideo(true);
        }
      } catch {
        // expo-video not available — stay on fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Always render the fallback — it auto-finishes after the timeout
  return <FallbackSplash onFinish={onFinish} />;
}

/**
 * Elegant branded splash fallback — animated logo + tagline that fades out
 * after ~2.5s. Works everywhere, no native dependencies.
 */
function FallbackSplash({ onFinish }: { onFinish: () => void }) {
  const fadeOut = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Then fade out & call onFinish
    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }] }]}>
        <Text style={styles.logoText}>🐐</Text>
        <Text style={styles.brandName}>Qurbani</Text>
        <Text style={styles.brandSub}>Market</Text>
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: textFade }]}>
        Buy & Sell with Trust
      </Animated.Text>
    </Animated.View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B1E2D",
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    alignItems: "center",
    gap: 4,
  },
  logoText: {
    fontSize: 64,
  },
  brandName: {
    fontSize: 36,
    fontWeight: "700",
    color: "#4ECDC4",
    letterSpacing: 2,
    marginTop: 12,
  },
  brandSub: {
    fontSize: 18,
    fontWeight: "500",
    color: "#D4AF37",
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginTop: 32,
    letterSpacing: 1,
  },
});
