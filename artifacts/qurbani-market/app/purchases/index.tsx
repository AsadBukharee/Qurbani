import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCart, type Purchase } from "@/contexts/CartContext";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#F59E0B", icon: "clock" as const },
  confirmed: { label: "Confirmed", color: "#10B981", icon: "check-circle" as const },
  paid: { label: "Paid", color: "#10B981", icon: "check-circle" as const },
  cancelled: { label: "Cancelled", color: "#EF4444", icon: "x-circle" as const },
};

function PurchaseCard({ purchase, onPress }: { purchase: Purchase; onPress: () => void }) {
  const colors = useColors();
  const status = STATUS_CONFIG[purchase.status];
  const date = new Date(purchase.purchasedAt).toLocaleDateString("en-PK", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.animalTitle, { color: colors.foreground }]} numberOfLines={1}>
            {purchase.listing.title}
          </Text>
          <Text style={[styles.invoiceNum, { color: colors.mutedForeground }]}>
            {purchase.invoiceNumber}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.color + "22" }]}>
          <Feather name={status.icon} size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
        <View style={styles.metaItem}>
          <Feather name="map-pin" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{purchase.listing.city}</Text>
        </View>
        <View style={styles.metaItem}>
          <Feather name="calendar" size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{date}</Text>
        </View>
        <Text style={[styles.price, { color: colors.teal }]}>
          Rs. {purchase.finalPrice.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PurchasesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { purchases } = useCart();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>My Purchases</Text>
        <View style={{ width: 40 }} />
      </View>

      {purchases.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-bag" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No purchases yet</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Your purchase history will appear here after you buy an animal
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/listings")}
            style={[styles.browseBtn, { backgroundColor: colors.teal }]}
          >
            <Text style={[styles.browseBtnText, { color: colors.navy }]}>Browse Animals</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PurchaseCard
              purchase={item}
              onPress={() => router.push({ pathname: "/invoice/[id]", params: { id: item.id } })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  browseBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  browseBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 10 },
  animalTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  invoiceNum: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardBottom: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  price: { fontSize: 15, fontFamily: "Inter_700Bold", marginLeft: "auto" as any },
});
