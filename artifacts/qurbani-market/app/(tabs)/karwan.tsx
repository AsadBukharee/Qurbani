/**
 * Karwan — browse truck caravans to send animals between cities.
 * Filters: From city, To city, Date.
 * Data comes from the real backend API via KarwanContext.
 */
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StarryBackground } from "@/components/StarryBackground";
import { type Karwan, useKarwan } from "@/contexts/KarwanContext";
import { useLocation } from "@/contexts/LocationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function KarwanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { karwans, bookings, loading, error, refreshKarwans } = useKarwan();
  const { location } = useLocation();
  const { theme } = useTheme();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState(location?.city || "");
  const [date, setDate] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    return karwans.filter((k) => {
      const fOk = !from.trim() || k.origin.toLowerCase().includes(from.toLowerCase());
      const tOk = !to.trim() || k.destination.toLowerCase().includes(to.toLowerCase());
      const dOk = !date.trim() || k.departure_date.includes(date.trim());
      return fOk && tOk && dOk;
    });
  }, [karwans, from, to, date]);

  const activeBookings = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "delivered"
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {theme === "dark" && <StarryBackground />}

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 14 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.foreground }]}>Karwan</Text>
          <Text style={[styles.titleAr, { color: colors.gold }]}>کارواں</Text>
        </View>
        <View style={[styles.truckBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "55" }]}>
          <Feather name="truck" size={13} color={colors.gold} />
          <Text style={[styles.truckBadgeText, { color: colors.gold }]}>Cattle Transport</Text>
        </View>
      </View>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Find a truck to send or receive animals across Pakistan
      </Text>

      {/* Filter card */}
      <View style={[styles.filterCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
        <View style={styles.filterRow}>
          <View style={styles.filterField}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>From</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.navy, borderColor: colors.border }]}>
              <Feather name="map-pin" size={13} color={colors.teal} />
              <TextInput
                value={from}
                onChangeText={setFrom}
                placeholder="Origin city"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
          </View>
          <View style={styles.arrow}>
            <Feather name="arrow-right" size={16} color={colors.gold} />
          </View>
          <View style={styles.filterField}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>To</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.navy, borderColor: colors.border }]}>
              <Feather name="flag" size={13} color={colors.gold} />
              <TextInput
                value={to}
                onChangeText={setTo}
                placeholder="Destination"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>
          </View>
        </View>
        <View style={styles.filterField}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>Date (YYYY-MM-DD)</Text>
          <View style={[styles.inputBox, { backgroundColor: colors.navy, borderColor: colors.border }]}>
            <Feather name="calendar" size={13} color={colors.teal} />
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="2026-06-08"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.foreground }]}
            />
            {(from || to || date) ? (
              <TouchableOpacity onPress={() => { setFrom(""); setTo(""); setDate(""); }}>
                <Text style={[styles.clearText, { color: colors.gold }]}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* Active bookings strip */}
      {activeBookings.length > 0 && (
        <View style={styles.bookingsStrip}>
          <Feather name="package" size={13} color={colors.teal} />
          <Text style={[styles.bookingsText, { color: colors.foreground }]}>
            You have {activeBookings.length} active shipment{activeBookings.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Loading / error states */}
      {loading && (
        <ActivityIndicator
          style={{ marginTop: 32 }}
          size="large"
          color={colors.gold}
        />
      )}
      {!loading && error && (
        <View style={styles.errorBox}>
          <Feather name="wifi-off" size={18} color={colors.gold} />
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity onPress={refreshKarwans}>
            <Text style={[styles.retryText, { color: colors.teal }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {!loading && !error && (
        <FlatList
          data={filtered}
          keyExtractor={(k) => k.id}
          onRefresh={refreshKarwans}
          refreshing={loading}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 100, gap: 12 }}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsCount, { color: colors.foreground }]}>
                {filtered.length} karwan{filtered.length !== 1 ? "s" : ""} available
              </Text>
              <Feather name="filter" size={14} color={colors.mutedForeground} />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="truck" size={42} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No karwans match your filters
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Try clearing filters or different cities
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <KarwanCard
              karwan={item}
              colors={colors}
              onPress={() => router.push(`/karwan/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

function KarwanCard({
  karwan,
  colors,
  onPress,
}: {
  karwan: Karwan;
  colors: any;
  onPress: () => void;
}) {
  const remaining = karwan.available_kg;
  const fillPct = (karwan.booked_kg / karwan.capacity_kg) * 100;
  const dep = new Date(karwan.departure_date);
  const arr = new Date(karwan.arrival_date);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
    >
      <View style={styles.cardTop}>
        <View style={styles.routeBlock}>
          <Text style={[styles.cityName, { color: colors.foreground }]}>{karwan.origin}</Text>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{fmt(dep)}</Text>
        </View>
        <View style={styles.routeLine}>
          <View style={[styles.dot, { backgroundColor: colors.teal }]} />
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Feather name="truck" size={14} color={colors.gold} />
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.gold }]} />
        </View>
        <View style={[styles.routeBlock, { alignItems: "flex-end" }]}>
          <Text style={[styles.cityName, { color: colors.foreground }]}>{karwan.destination}</Text>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{fmt(arr)}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.cardMid}>
        <View>
          <Text style={[styles.operatorName, { color: colors.foreground }]}>
            {karwan.operator_name}
          </Text>
          <View style={styles.operatorMeta}>
            <Feather name="star" size={12} color={colors.gold} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {parseFloat(karwan.rating).toFixed(1)} · {karwan.total_trips} trips
            </Text>
            <View style={[styles.typePill, { backgroundColor: colors.teal + "22", borderColor: colors.teal + "55" }]}>
              <Text style={[styles.typeText, { color: colors.teal }]}>
                {karwan.truck_type.replace("-", " ")}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.priceBlock}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>per kg</Text>
          <Text style={[styles.priceValue, { color: colors.gold }]}>
            Rs. {karwan.price_per_kg}
          </Text>
        </View>
      </View>

      <View style={styles.capacity}>
        <View style={styles.capacityHead}>
          <Text style={[styles.capacityText, { color: colors.mutedForeground }]}>
            {karwan.booked_kg.toLocaleString()} / {karwan.capacity_kg.toLocaleString()} kg booked
          </Text>
          <Text style={[styles.capacityText, { color: remaining < 1000 ? colors.gold : colors.teal }]}>
            {remaining.toLocaleString()} kg left
          </Text>
        </View>
        <View style={[styles.capacityBar, { backgroundColor: colors.navy }]}>
          <View
            style={{
              width: `${Math.min(100, fillPct)}%`,
              height: "100%",
              backgroundColor: fillPct > 80 ? colors.gold : colors.teal,
              borderRadius: 4,
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  headerLeft: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  titleAr: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  truckBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  truckBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  filterCard: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  filterRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  filterField: { flex: 1, gap: 5 },
  filterLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", padding: 0 },
  clearText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  arrow: { paddingBottom: 10 },
  bookingsStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 4,
  },
  bookingsText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  errorBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
    paddingHorizontal: 20,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  retryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  resultsCount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  card: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeBlock: { minWidth: 70 },
  cityName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  dateText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  routeLine: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  line: { flex: 1, height: 1.5 },
  divider: { height: StyleSheet.hairlineWidth },
  cardMid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  operatorName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  operatorMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  metaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 4,
  },
  typeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  priceBlock: { alignItems: "flex-end" },
  priceLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  priceValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  capacity: { gap: 6 },
  capacityHead: { flexDirection: "row", justifyContent: "space-between" },
  capacityText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  capacityBar: { height: 6, borderRadius: 4, overflow: "hidden" },
  emptyState: { alignItems: "center", paddingVertical: 50, gap: 8 },
  emptyText: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 6 },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
