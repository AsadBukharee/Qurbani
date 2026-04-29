/**
 * VideoSplash — cinematic splash screen that plays
 * `assets/videos/splash.mp4` and fades out when the video ends.
 *
 * Falls back to a branded animated splash if expo-video isn't available
 * (e.g. older Expo Go without the native module).
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

// Try to load expo-video at module scope. If it isn't installed or
// throws (older Expo Go), `Video` stays null and we render the
// animated brand splash instead.
let ExpoVideo: typeof import("expo-video") | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ExpoVideo = require("expo-video");
} catch {
  ExpoVideo = null;
}

const SPLASH_VIDEO = require("../assets/videos/splash.mp4");

// Hard cap on how long we let the splash linger, even if the video
// never reports completion. Keeps users from getting stuck.
const MAX_DURATION_MS = 6000;

export function VideoSplash({ onFinish }: VideoSplashProps) {
  const [hasError, setHasError] = useState(false);

  // If expo-video isn't available, or the player errors out, show the
  // animated fallback (which calls onFinish itself).
  if (!ExpoVideo || hasError) {
    return <FallbackSplash onFinish={onFinish} />;
  }

  return (
    <VideoPlayerSplash
      onFinish={onFinish}
      onError={() => setHasError(true)}
    />
  );
}

function VideoPlayerSplash({
  onFinish,
  onError,
}: {
  onFinish: () => void;
  onError: () => void;
}) {
  // SAFETY: ExpoVideo is non-null here per parent guard.
  const { useVideoPlayer, VideoView } = ExpoVideo!;

  const fadeOut = useRef(new Animated.Value(1)).current;
  const finishedRef = useRef(false);

  const finishOnce = React.useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [fadeOut, onFinish]);

  const player = useVideoPlayer(SPLASH_VIDEO, (p) => {
    try {
      p.muted = true;
      p.loop = false;
      p.play();
    } catch (err) {
      console.warn("[VideoSplash] play failed", err);
      onError();
    }
  });

  useEffect(() => {
    if (!player) return;
    // Listen for playback end. expo-video exposes a 'playToEnd' event.
    let sub: { remove: () => void } | undefined;
    try {
      sub = player.addListener?.("playToEnd", () => finishOnce());
    } catch {
      // ignore — safety timeout below will handle it
    }

    const timer = setTimeout(finishOnce, MAX_DURATION_MS);

    return () => {
      clearTimeout(timer);
      sub?.remove?.();
    };
  }, [player, finishOnce]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </Animated.View>
  );
}

/**
 * Branded animated fallback — used when expo-video can't load.
 */
function FallbackSplash({ onFinish }: { onFinish: () => void }) {
  const fadeOut = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    const timer = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish, fadeOut, scale, textFade]);

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
