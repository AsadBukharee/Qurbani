/**
 * Karwan detail — operator info, pricing, capacity, and "Send my animal" booking.
 * Uses real backend API via KarwanContext.
 */
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { StarryBackground } from "@/components/StarryBackground";
import { useApp } from "@/contexts/AppContext";
import { useKarwan } from "@/contexts/KarwanContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

export default function KarwanDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { karwans, addBooking } = useKarwan();
  const { listings, user } = useApp();

  // Find this karwan (id is a hashid from the API)
  const karwan = karwans.find((k) => k.id === id);
  const myAnimals = listings.filter((l) => l.seller.id === user?.id);

  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!karwan) {
    return (
      <View style={[styles.root, { backgroundColor: colors.navy }]}>
        <Text style={{ color: colors.foreground, padding: 20 }}>Karwan not found.</Text>
      </View>
    );
  }

  const remaining = karwan.available_kg;
  const selectedAnimal = myAnimals.find((a) => a.id === selectedAnimalId);
  const animalWeightKg = selectedAnimal
    ? Number(selectedAnimal.weight) || 0
    : 0;
  const totalCost = animalWeightKg * karwan.price_per_kg;

  const handleBook = async () => {
    if (!user) {
      Alert.alert("Login required", "Please sign in to send an animal.");
      return;
    }
    if (!selectedAnimal) {
      Alert.alert("Pick an animal", "Select one of your animals to ship.");
      return;
    }
    if (animalWeightKg > remaining) {
      Alert.alert("Capacity exceeded", `Only ${remaining.toLocaleString()} kg remaining on this karwan.`);
      return;
    }

    setBooking(true);
    const result = await addBooking({
      karwanId: karwan.id,
      animalId: selectedAnimal.id,
      animalTitle: selectedAnimal.title,
      weightKg: animalWeightKg,
    });
    setBooking(false);

    if (result) {
      Alert.alert(
        "Shipment booked!",
        `${selectedAnimal.title} will travel via ${karwan.truck_name} from ${karwan.origin} to ${karwan.destination}.\n\nTotal: Rs. ${totalCost.toLocaleString()}\nStatus: Pending confirmation.`,
        [{ text: "Done", onPress: () => router.back() }]
      );
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${karwan.operator_phone}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    const num = karwan.operator_phone.replace(/\D/g, "");
    Linking.openURL(`whatsapp://send?phone=${num}`).catch(() => {
      Linking.openURL(`https://wa.me/${num}`).catch(() => {});
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {theme === "dark" && <StarryBackground />}
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          paddingTop: topPad + 12,
          paddingBottom: bottomPad + 140,
        }}
        bottomOffset={120}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Karwan Details</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Hero card */}
        <View style={[styles.hero, { backgroundColor: colors.navyLight, borderColor: colors.gold + "55" }]}>
          <View style={styles.heroRouteRow}>
            <View>
              <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>FROM</Text>
              <Text style={[styles.heroCity, { color: colors.foreground }]}>{karwan.origin}</Text>
              <Text style={[styles.heroDate, { color: colors.teal }]}>
                {new Date(karwan.departure_date).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </Text>
            </View>
            <Feather name="truck" size={26} color={colors.gold} />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>TO</Text>
              <Text style={[styles.heroCity, { color: colors.foreground }]}>{karwan.destination}</Text>
              <Text style={[styles.heroDate, { color: colors.gold }]}>
                {new Date(karwan.arrival_date).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </Text>
            </View>
          </View>
          <View style={[styles.heroPricePill, { backgroundColor: colors.gold }]}>
            <Text style={[styles.heroPriceText, { color: colors.navy }]}>
              Rs. {karwan.price_per_kg} / kg
            </Text>
          </View>
        </View>

        {/* Operator */}
        <Section title="Operator" colors={colors}>
          <View style={[styles.opCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <View style={[styles.opAvatar, { backgroundColor: colors.teal + "22" }]}>
              <Feather name="user" size={22} color={colors.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.opName, { color: colors.foreground }]}>{karwan.operator_name}</Text>
              <Text style={[styles.opTruck, { color: colors.mutedForeground }]}>
                {karwan.truck_name} · {karwan.truck_type.replace("-", " ")}
              </Text>
              <View style={styles.opStats}>
                <Feather name="star" size={11} color={colors.gold} />
                <Text style={[styles.opStatText, { color: colors.mutedForeground }]}>
                  {parseFloat(karwan.rating).toFixed(1)} · {karwan.total_trips} trips
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.contactRow}>
            <TouchableOpacity
              onPress={handleCall}
              style={[styles.contactBtn, { backgroundColor: colors.teal }]}
            >
              <Feather name="phone" size={15} color={colors.navy} />
              <Text style={[styles.contactText, { color: colors.navy }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={[styles.contactBtn, { backgroundColor: "#25D366" }]}
            >
              <Feather name="message-circle" size={15} color="#fff" />
              <Text style={[styles.contactText, { color: "#fff" }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Capacity */}
        <Section title="Capacity" colors={colors}>
          <View style={[styles.statCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Stat label="Total" value={`${karwan.capacity_kg.toLocaleString()} kg`} colors={colors} />
            <Stat label="Booked" value={`${karwan.booked_kg.toLocaleString()} kg`} colors={colors} />
            <Stat
              label="Remaining"
              value={`${remaining.toLocaleString()} kg`}
              valueColor={remaining < 1000 ? colors.gold : colors.teal}
              colors={colors}
            />
          </View>
          {karwan.notes ? (
            <Text style={[styles.notes, { color: colors.mutedForeground }]}>
              ℹ {karwan.notes}
            </Text>
          ) : null}
        </Section>

        {/* Pick animal to ship */}
        <Section title="Send your animal" colors={colors}>
          {myAnimals.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
              <Feather name="package" size={20} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                You haven't listed any animals yet.
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/listings")}>
                <Text style={[styles.emptyLink, { color: colors.teal }]}>Browse market →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {myAnimals.map((a) => {
                const isSel = selectedAnimalId === a.id;
                return (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setSelectedAnimalId(a.id)}
                    style={[
                      styles.animalRow,
                      {
                        backgroundColor: colors.navyLight,
                        borderColor: isSel ? colors.gold : colors.border,
                        borderWidth: isSel ? 2 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.checkBox, { borderColor: isSel ? colors.gold : colors.border, backgroundColor: isSel ? colors.gold : "transparent" }]}>
                      {isSel ? <Feather name="check" size={12} color={colors.navy} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.animalTitle, { color: colors.foreground }]}>{a.title}</Text>
                      <Text style={[styles.animalMeta, { color: colors.mutedForeground }]}>
                        {a.weight} · {a.breed}
                      </Text>
                    </View>
                    <Text style={[styles.animalPrice, { color: colors.gold }]}>
                      Rs. {a.price.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Section>

        {/* Cost summary */}
        {selectedAnimal && (
          <View style={[styles.summary, { backgroundColor: colors.navyLight, borderColor: colors.gold + "55" }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Shipment Cost</Text>
            <Row label="Animal weight" value={`${animalWeightKg} kg`} colors={colors} />
            <Row label="Rate" value={`Rs. ${karwan.price_per_kg} / kg`} colors={colors} />
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Row
              label="Total shipping"
              value={`Rs. ${totalCost.toLocaleString()}`}
              valueColor={colors.gold}
              bold
              colors={colors}
            />
          </View>
        )}
      </KeyboardAwareScrollViewCompat>

      {/* Sticky CTA */}
      <View
        style={[
          styles.stickyBar,
          {
            backgroundColor: colors.navyLight,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBook}
          style={[
            styles.bookBtn,
            { backgroundColor: selectedAnimal && !booking ? colors.gold : colors.border },
          ]}
          disabled={!selectedAnimal || booking}
        >
          <Feather
            name="truck"
            size={16}
            color={selectedAnimal && !booking ? colors.navy : colors.mutedForeground}
          />
          <Text
            style={[
              styles.bookText,
              { color: selectedAnimal && !booking ? colors.navy : colors.mutedForeground },
            ]}
          >
            {booking
              ? "Booking…"
              : selectedAnimal
              ? `Book Karwan · Rs. ${totalCost.toLocaleString()}`
              : "Select an animal"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Section({ title, children, colors }: any) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({ label, value, valueColor, colors }: any) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: valueColor || colors.foreground, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function Row({ label, value, valueColor, bold, colors }: any) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ fontSize: 13, fontFamily: bold ? "Inter_700Bold" : "Inter_500Medium", color: valueColor || colors.foreground }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  hero: {
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    gap: 14,
  },
  heroRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  heroLabel: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 1 },
  heroCity: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  heroDate: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  heroPricePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  heroPriceText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 20, marginTop: 22, gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  opCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  opAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  opName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  opTruck: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, textTransform: "capitalize" },
  opStats: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  opStatText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  contactRow: { flexDirection: "row", gap: 10 },
  contactBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 12,
  },
  contactText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statCard: { flexDirection: "row", padding: 14, borderRadius: 14, borderWidth: 1 },
  notes: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  empty: { padding: 18, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 6 },
  emptyText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  emptyLink: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  animalRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12,
  },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  animalTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  animalMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  animalPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  summary: {
    marginHorizontal: 20, marginTop: 22, padding: 14,
    borderRadius: 14, borderWidth: 1.5,
  },
  summaryTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 8 },
  dividerLine: { height: StyleSheet.hairlineWidth, marginVertical: 6 },
  stickyBar: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12,
  },
  bookBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  bookText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
