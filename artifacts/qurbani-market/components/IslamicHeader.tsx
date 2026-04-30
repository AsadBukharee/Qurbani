import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../hooks/useColors";

interface IslamicHeaderProps {
  title: string;
  subtitle?: string;
  showMoon?: boolean;
}

export function IslamicHeader({ title, subtitle, showMoon = true }: IslamicHeaderProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      {showMoon && (
        <View style={styles.moonRow}>
          <Text style={[styles.moon, { color: colors.gold }]}>☽</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.star, { color: colors.gold }]}>✦</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.moon, { color: colors.gold, transform: [{ scaleX: -1 }] }]}>☽</Text>
        </View>
      )}
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 4,
  },
  moonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  moon: {
    fontSize: 18,
  },
  star: {
    fontSize: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    maxWidth: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
