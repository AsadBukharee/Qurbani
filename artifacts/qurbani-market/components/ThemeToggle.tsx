import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 20 }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const colors = useColors();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleToggle = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();
    toggleTheme();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const isDark = theme === "dark";

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[
        styles.btn,
        {
          backgroundColor: isDark ? colors.navyMid : colors.navyMid,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Feather
          name={isDark ? "sun" : "moon"}
          size={size}
          color={isDark ? colors.gold : colors.teal}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
