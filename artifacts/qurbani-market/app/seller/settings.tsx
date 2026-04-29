import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { StarryBackground } from "@/components/StarryBackground";
import { useApp } from "@/contexts/AppContext";
import { useKarwan } from "@/contexts/KarwanContext";
import { useColors } from "@/hooks/useColors";

export default function SellerSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, coupons, addCoupon, updateCoupon, deleteCoupon } = useApp();
  const { bookings, bookingsLoading, cancelBooking, refreshBookings } = useKarwan();
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [adding, setAdding] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const myCoupons = coupons.filter((c) => c.sellerId === user?.id);

  const handleAdd = () => {
    const code = newCode.trim().toUpperCase();
    const discount = parseFloat(newDiscount);

    if (!code) {
      Alert.alert("Missing Code", "Please enter a coupon code.");
      return;
    }
    if (code.length < 3) {
      Alert.alert("Code Too Short", "Coupon code must be at least 3 characters.");
      return;
    }
    if (isNaN(discount) || discount < 1 || discount > 99) {
      Alert.alert("Invalid Discount", "Discount must be between 1% and 99%.");
      return;
    }
    const exists = myCoupons.find((c) => c.code === code);
    if (exists) {
      Alert.alert("Duplicate Code", "You already have a coupon with this code.");
      return;
    }

    addCoupon({
      sellerId: user!.id,
      code,
      discount,
      isActive: true,
    });
    setNewCode("");
    setNewDiscount("");
    setAdding(false);
  };

  const handleDelete = (id: string, code: string) => {
    Alert.alert(
      "Delete Coupon",
      `Remove coupon "${code}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteCoupon(id),
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Seller Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: bottomPad + 80,
          gap: 20,
        }}
        bottomOffset={120}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Coupon Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Coupon Codes
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Offer discounts to your buyers
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAdding((v) => !v)}
            style={[styles.addBtn, { backgroundColor: colors.teal }]}
          >
            <Feather name={adding ? "x" : "plus"} size={18} color={colors.navy} />
            <Text style={[styles.addBtnText, { color: colors.navy }]}>
              {adding ? "Cancel" : "New"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add Coupon Form */}
        {adding && (
          <View style={[styles.addForm, { backgroundColor: colors.navyLight, borderColor: colors.teal + "44" }]}>
            <Text style={[styles.formLabel, { color: colors.foreground }]}>
              ✦ Create Coupon
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Coupon Code
              </Text>
              <TextInput
                value={newCode}
                onChangeText={(t) => setNewCode(t.toUpperCase())}
                placeholder="e.g. EID2024"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.navy,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Discount Percentage (1–99%)
              </Text>
              <View style={[styles.discountRow, { backgroundColor: colors.navy, borderColor: colors.border }]}>
                <TextInput
                  value={newDiscount}
                  onChangeText={setNewDiscount}
                  placeholder="10"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={[styles.discountInput, { color: colors.foreground }]}
                />
                <Text style={[styles.percentSign, { color: colors.gold }]}>%</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.createBtn, { backgroundColor: colors.gold }]}
            >
              <Feather name="tag" size={16} color={colors.navy} />
              <Text style={[styles.createBtnText, { color: colors.navy }]}>Create Coupon</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Existing Coupons */}
        {myCoupons.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Feather name="tag" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Coupons Yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Create coupon codes to offer discounts and attract more buyers
            </Text>
          </View>
        ) : (
          <View style={styles.couponList}>
            {myCoupons.map((coupon) => (
              <View
                key={coupon.id}
                style={[
                  styles.couponCard,
                  {
                    backgroundColor: colors.navyLight,
                    borderColor: coupon.isActive
                      ? colors.gold + "55"
                      : colors.border,
                  },
                ]}
              >
                {/* Left: code + discount */}
                <View style={styles.couponLeft}>
                  <View style={[styles.discountBadge, { backgroundColor: coupon.isActive ? colors.gold + "22" : colors.navyLight }]}>
                    <Text style={[styles.discountBadgeText, { color: coupon.isActive ? colors.gold : colors.mutedForeground }]}>
                      {coupon.discount}% OFF
                    </Text>
                  </View>
                  <Text style={[styles.couponCode, { color: coupon.isActive ? colors.foreground : colors.mutedForeground }]}>
                    {coupon.code}
                  </Text>
                  <Text style={[styles.couponStatus, { color: coupon.isActive ? colors.teal : colors.mutedForeground }]}>
                    {coupon.isActive ? "● Active" : "○ Inactive"}
                  </Text>
                </View>

                {/* Right: toggle + delete */}
                <View style={styles.couponRight}>
                  <Switch
                    value={coupon.isActive}
                    onValueChange={(val) => {
                      void updateCoupon(coupon.id, { isActive: val });
                    }}
                    trackColor={{ false: colors.border, true: colors.teal + "88" }}
                    thumbColor={coupon.isActive ? colors.teal : colors.mutedForeground}
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(coupon.id, coupon.code)}
                    style={[styles.deleteBtn, { borderColor: colors.destructive + "44" }]}
                  >
                    <Feather name="trash-2" size={15} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          <Text style={[styles.tipsTitle, { color: colors.gold }]}>💡 Tips</Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            • Share coupon codes with buyers via WhatsApp or calls
          </Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            • Toggle a coupon off to pause it without deleting
          </Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            • Buyers enter the code on the animal listing page
          </Text>
        </View>
        {/* ── My Shipments (Karwan Bookings) ───────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              My Shipments
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Karwan bookings for your animals
            </Text>
          </View>
          <TouchableOpacity
            onPress={refreshBookings}
            style={[styles.addBtn, { backgroundColor: colors.navyLight, borderWidth: 1, borderColor: colors.border }]}
          >
            <Feather name="refresh-cw" size={15} color={colors.teal} />
          </TouchableOpacity>
        </View>

        {bookingsLoading ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Feather name="loader" size={20} color={colors.mutedForeground} />
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Loading shipments…</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Feather name="truck" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Shipments Yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Book a Karwan from the Karwan tab to ship your animals
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {bookings.map((b) => {
              const statusColors: Record<string, string> = {
                pending:    colors.gold,
                confirmed:  colors.teal,
                in_transit: "#F97316",
                delivered:  "#22C55E",
                cancelled:  colors.mutedForeground,
              };
              const statusLabel: Record<string, string> = {
                pending:    "Pending",
                confirmed:  "Confirmed",
                in_transit: "In Transit",
                delivered:  "Delivered",
                cancelled:  "Cancelled",
              };
              const canCancel = b.status === "pending" || b.status === "confirmed";
              const isTerminal = b.status === "delivered" || b.status === "cancelled";
              const sc = statusColors[b.status] ?? colors.mutedForeground;

              return (
                <View
                  key={b.id}
                  style={[
                    styles.couponCard,
                    {
                      backgroundColor: colors.navyLight,
                      borderColor: isTerminal ? colors.border : sc + "55",
                      flexDirection: "column",
                      gap: 8,
                    },
                  ]}
                >
                  {/* Route + Status */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.foreground }}>
                      {b.karwan_detail.origin} → {b.karwan_detail.destination}
                    </Text>
                    <View style={[styles.discountBadge, { backgroundColor: sc + "22" }]}>
                      <Text style={[styles.discountBadgeText, { color: sc }]}>
                        {statusLabel[b.status] ?? b.status}
                      </Text>
                    </View>
                  </View>

                  {/* Animal + operator */}
                  <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                    {b.animal_title} · {b.weight_kg} kg · via {b.karwan_detail.operator_name}
                  </Text>

                  {/* Dep date + total cost */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>
                      Departs {new Date(b.karwan_detail.departure_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.gold }}>
                      Rs. {b.total_cost.toLocaleString()}
                    </Text>
                  </View>

                  {/* Cancel button */}
                  {canCancel && (
                    <TouchableOpacity
                      onPress={async () => {
                        Alert.alert(
                          "Cancel Shipment",
                          `Cancel shipping of "${b.animal_title}"?`,
                          [
                            { text: "Keep", style: "cancel" },
                            {
                              text: "Cancel Shipment",
                              style: "destructive",
                              onPress: async () => {
                                setCancellingId(b.id);
                                await cancelBooking(b.id);
                                setCancellingId(null);
                              },
                            },
                          ]
                        );
                      }}
                      style={[styles.deleteBtn, { borderColor: colors.destructive + "44", width: "100%", height: 34, borderRadius: 8, flexDirection: "row", gap: 6 }]}
                      disabled={cancellingId === b.id}
                    >
                      <Feather name="x-circle" size={14} color={colors.destructive} />
                      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.destructive }}>
                        {cancellingId === b.id ? "Cancelling…" : "Cancel Shipment"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  addForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  formLabel: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  discountInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  percentSign: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  couponList: {
    gap: 12,
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  couponLeft: {
    gap: 4,
  },
  discountBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  discountBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  couponCode: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  couponStatus: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  couponRight: {
    alignItems: "center",
    gap: 10,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  tipsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
