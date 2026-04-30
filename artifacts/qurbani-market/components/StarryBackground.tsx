import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("screen");

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
}

export function StarryBackground() {
  const stars = useRef<Star[]>(
    Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2.5 + 0.5,
      opacity: new Animated.Value(Math.random() * 0.6 + 0.2),
    }))
  ).current;

  useEffect(() => {
    const animations = stars.map((star) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.8 + 0.2,
            duration: 1500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.3,
            duration: 1500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [stars]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {stars.map((star, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: "#E8F4F8",
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
}
