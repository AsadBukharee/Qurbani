/**
 * Wishlist screen — shows all animals the user has hearted.
 */
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimalCard } from "@/components/AnimalCard";
import { StarryBackground } from "@/components/StarryBackground";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listings, favorites } = useApp();
  const { theme } = useTheme();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const wishlistItems = listings.filter((l) => favorites.includes(l.id));

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {theme === "dark" && <StarryBackground />}
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Feather name="heart" size={20} color="#FF4B6E" />
              <Text style={[styles.title, { color: colors.foreground }]}>Wishlist</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {wishlistItems.length} shortlisted animal{wishlistItems.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {wishlistItems.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
              <Feather name="heart" size={36} color="#FF4B6E" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nothing saved yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap the heart on any animal to save it for later.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/listings")}
              style={[styles.browseBtn, { backgroundColor: colors.teal }]}
            >
              <Feather name="search" size={15} color={colors.navy} />
              <Text style={[styles.browseText, { color: colors.navy }]}>Browse Animals</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {wishlistItems.map((item) => (
              <View key={item.id} style={styles.gridItem}>
                <AnimalCard listing={item} onPress={() => router.push(`/animal/${item.id}`)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 14,
  },
  emptyIcon: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  browseBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 18, paddingVertical: 11, borderRadius: 24,
    marginTop: 6,
  },
  browseText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  grid: { gap: 12, paddingHorizontal: 20 },
  gridItem: { width: "100%" },
});
