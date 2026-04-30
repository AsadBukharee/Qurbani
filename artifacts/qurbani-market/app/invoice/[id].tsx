import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCart } from "@/contexts/CartContext";

const STATUS_CONFIG = {
  pending: { label: "Payment Pending", color: "#F59E0B", icon: "clock" as const, bg: "#F59E0B22" },
  confirmed: { label: "Order Confirmed", color: "#10B981", icon: "check-circle" as const, bg: "#10B98122" },
  paid: { label: "Paid", color: "#10B981", icon: "check-circle" as const, bg: "#10B98122" },
  cancelled: { label: "Cancelled", color: "#EF4444", icon: "x-circle" as const, bg: "#EF444422" },
};

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getPurchase } = useCart();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const purchase = getPurchase(id || "");

  if (!purchase) {
    return (
      <View style={[styles.root, { backgroundColor: colors.navy }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Invoice</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.notFound}>
          <Feather name="file-x" size={48} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Invoice not found</Text>
        </View>
      </View>
    );
  }

  const status = STATUS_CONFIG[purchase.status];
  const purchaseDate = new Date(purchase.purchasedAt);
  const dateStr = purchaseDate.toLocaleDateString("en-PK", {
    year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = purchaseDate.toLocaleTimeString("en-PK", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Invoice</Text>
        <TouchableOpacity
          onPress={() => router.push("/purchases")}
          style={styles.historyBtn}
        >
          <Feather name="list" size={20} color={colors.teal} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: status.bg, borderColor: status.color + "44" }]}>
          <Feather name={status.icon} size={28} color={status.color} />
          <View>
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
            <Text style={[styles.statusSub, { color: status.color + "bb" }]}>
              {purchase.status === "pending"
                ? "Awaiting payment confirmation from seller"
                : purchase.status === "confirmed"
                ? "Your order has been confirmed"
                : purchase.status === "paid"
                ? "Transaction completed successfully"
                : "This order was cancelled"}
            </Text>
          </View>
        </View>

        {/* Invoice Header */}
        <View style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.gold + "33" }]}>
          <View style={styles.invoiceHeaderRow}>
            <View>
              <Text style={[styles.invoiceLabel, { color: colors.mutedForeground }]}>INVOICE</Text>
              <Text style={[styles.invoiceNumber, { color: colors.gold }]}>{purchase.invoiceNumber}</Text>
            </View>
            <View style={styles.dateBlock}>
              <Text style={[styles.dateText, { color: colors.foreground }]}>{dateStr}</Text>
              <Text style={[styles.timeText, { color: colors.mutedForeground }]}>{timeStr}</Text>
            </View>
          </View>
        </View>

        {/* Animal Details */}
        <View style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Animal Details</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Name</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{purchase.listing.title}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Category</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {purchase.listing.category.charAt(0).toUpperCase() + purchase.listing.category.slice(1)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Breed</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{purchase.listing.breed}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Weight</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{purchase.listing.weight} kg</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Location</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>{purchase.listing.city}</Text>
          </View>
        </View>

        {/* Seller Info */}
        <View style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Seller</Text>
          <View style={styles.sellerRow}>
            <View style={[styles.sellerAvatar, { backgroundColor: colors.teal + "22", borderColor: colors.teal }]}>
              <Text style={[styles.sellerAvatarText, { color: colors.teal }]}>
                {purchase.listing.seller.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.sellerName, { color: colors.foreground }]}>{purchase.listing.seller.name}</Text>
              <Text style={[styles.sellerPhone, { color: colors.mutedForeground }]}>{purchase.listing.seller.phone}</Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Summary</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Listed Price</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              Rs. {purchase.listing.price.toLocaleString()}
            </Text>
          </View>
          {purchase.finalPrice !== purchase.listing.price && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Discount</Text>
                <Text style={[styles.detailValue, { color: colors.gold }]}>
                  - Rs. {(purchase.listing.price - purchase.finalPrice).toLocaleString()}
                </Text>
              </View>
            </>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total Amount</Text>
            <Text style={[styles.totalPrice, { color: colors.teal }]}>
              Rs. {purchase.finalPrice.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Payment Status */}
        <View style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Status</Text>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Feather name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusPillText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={[styles.paymentNote, { color: colors.mutedForeground }]}>
            {purchase.status === "pending"
              ? "Contact the seller directly to complete your payment via bank transfer or cash."
              : purchase.status === "confirmed"
              ? "Payment has been received and the order is confirmed. Coordinate with the seller for delivery."
              : ""}
          </Text>
          <View style={[styles.transactionRow, { borderColor: colors.border }]}>
            <Text style={[styles.transactionLabel, { color: colors.mutedForeground }]}>Reference ID</Text>
            <Text style={[styles.transactionValue, { color: colors.foreground }]}>{purchase.invoiceNumber}</Text>
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)")}
          style={[styles.homeBtn, { backgroundColor: colors.navyLight, borderColor: colors.teal + "55" }]}
        >
          <Feather name="home" size={18} color={colors.teal} />
          <Text style={[styles.homeBtnText, { color: colors.teal }]}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  historyBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  statusLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statusSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, maxWidth: 240 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  invoiceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  invoiceLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  invoiceNumber: { fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  dateBlock: { alignItems: "flex-end" },
  dateText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  timeText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginLeft: 16 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 4 },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sellerAvatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  sellerAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sellerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sellerPhone: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  totalLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  totalPrice: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: "flex-start",
  },
  statusPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  paymentNote: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  transactionRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingTop: 10, borderTopWidth: 1, marginTop: 4,
  },
  transactionLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  transactionValue: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  homeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14,
  },
  homeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
