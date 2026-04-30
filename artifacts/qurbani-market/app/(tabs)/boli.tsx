import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BoliCard } from "@/components/BoliCard";
import { StarryBackground } from "@/components/StarryBackground";
import { useBoli } from "@/contexts/BoliContext";
import { useColors } from "@/hooks/useColors";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Live" },
  { id: "goat", label: "Bakra" },
  { id: "cow", label: "Cow" },
  { id: "sheep", label: "Dumba" },
  { id: "ended", label: "Ended" },
];

export default function BoliScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { boliListings } = useBoli();
  const [activeFilter, setActiveFilter] = useState("all");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const activeLiveCount = boliListings.filter((l) => l.status === "active").length;

  const filtered = boliListings.filter((l) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "active") return l.status === "active";
    if (activeFilter === "ended") return l.status !== "active";
    return l.category === activeFilter;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />

      <View style={[styles.stickyHeader, { paddingTop: topPad + 12, backgroundColor: colors.navy + "f5", borderBottomColor: colors.gold + "33" }]}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Boli </Text>
              <Text style={[styles.titleAr, { color: colors.gold }]}>بولی</Text>
            </View>
            <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
              Live animal auctions
            </Text>
          </View>
          <View style={styles.titleRight}>
            {activeLiveCount > 0 && (
              <View style={[styles.livePill, { backgroundColor: "#FF4B6E22", borderColor: "#FF4B6E66" }]}>
                <View style={[styles.liveDot, { backgroundColor: "#FF4B6E" }]} />
                <Text style={[styles.liveText, { color: "#FF4B6E" }]}>
                  {activeLiveCount} Live
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => router.push("/boli/create")}
              style={[styles.createBtn, { backgroundColor: colors.gold, borderColor: colors.gold }]}
            >
              <Feather name="plus" size={16} color={colors.navy} />
              <Text style={[styles.createBtnText, { color: colors.navy }]}>Create Boli</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter chips */}
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.id)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === item.id ? colors.gold : colors.navyMid,
                  borderColor: activeFilter === item.id ? colors.gold : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: activeFilter === item.id ? colors.navy : colors.mutedForeground }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 90, gap: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BoliCard listing={item} onPress={() => router.push(`/boli/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="clock" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No auctions found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Be the first to create a Boli listing!
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/boli/create")}
              style={[styles.emptyBtn, { backgroundColor: colors.gold }]}
            >
              <Text style={[styles.emptyBtnText, { color: colors.navy }]}>Create Boli</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stickyHeader: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  titleAr: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  titleRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
