import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { useApp } from "@/contexts/AppContext";
import { wallet as walletApi, apiErrorMessage } from "@/lib/api";

const ANIMAL_IMAGES: Record<string, any> = {
  goat_featured: require("../../assets/images/goat_featured.png"),
  cow_featured: require("../../assets/images/cow_featured.png"),
  sheep_featured: require("../../assets/images/sheep_featured.png"),
};

function getImageSource(item: CartItem) {
  const img = item.listing.images[0] || `${item.listing.category}_featured`;
  if (typeof img === "string" && /^https?:\/\//i.test(img)) return { uri: img };
  return ANIMAL_IMAGES[img] || ANIMAL_IMAGES[`${item.listing.category}_featured`] || ANIMAL_IMAGES["goat_featured"];
}

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cartItems, removeFromCart, clearCart, checkout, addPurchase } = useCart();
  const { user, isAuthenticated } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const total = cartItems.reduce((sum, c) => sum + c.finalPrice, 0);

  const handleCheckout = async (item: CartItem) => {
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to purchase animals.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    setCheckingOut(item.listing.id);
    try {
      const purchase = checkout(item);
      if (walletApi) {
        try {
          await walletApi.submitPaymentRequest({
            payment_receiver: item.listing.seller.id,
            amount: item.finalPrice,
            transaction_id: purchase.invoiceNumber,
          });
          const confirmedPurchase = { ...purchase, status: "confirmed" as const };
          addPurchase(confirmedPurchase);
          removeFromCart(item.listing.id);
          router.push({ pathname: "/invoice/[id]", params: { id: confirmedPurchase.id } });
        } catch {
          addPurchase(purchase);
          removeFromCart(item.listing.id);
          router.push({ pathname: "/invoice/[id]", params: { id: purchase.id } });
        }
      } else {
        addPurchase(purchase);
        removeFromCart(item.listing.id);
        router.push({ pathname: "/invoice/[id]", params: { id: purchase.id } });
      }
    } catch (err) {
      Alert.alert("Checkout Failed", apiErrorMessage(err));
    } finally {
      setCheckingOut(null);
    }
  };

  const handleRemove = (id: string) => {
    Alert.alert("Remove Item", "Remove this animal from your cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeFromCart(id) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>My Cart</Text>
        {cartItems.length > 0 ? (
          <TouchableOpacity
            onPress={() => Alert.alert("Clear Cart", "Remove all items?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart },
            ])}
            style={styles.clearBtn}
          >
            <Text style={[styles.clearText, { color: colors.destructive }]}>Clear</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 52 }} />}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="shopping-cart" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your cart is empty</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Browse animals and add them to your cart
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/listings")}
            style={[styles.browseBtn, { backgroundColor: colors.teal }]}
          >
            <Text style={[styles.browseBtnText, { color: colors.navy }]}>Browse Animals</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.listing.id}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: bottomPad + 120 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.cartCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
                <Image source={getImageSource(item)} style={styles.animalImage} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <Text style={[styles.animalTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {item.listing.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {item.listing.city}
                    </Text>
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {item.listing.weight} kg
                    </Text>
                  </View>
                  {item.appliedCoupon && (
                    <View style={[styles.couponBadge, { backgroundColor: colors.gold + "22" }]}>
                      <Feather name="tag" size={11} color={colors.gold} />
                      <Text style={[styles.couponText, { color: colors.gold }]}>
                        {item.appliedCoupon.code} — {item.appliedCoupon.discount}% OFF
                      </Text>
                    </View>
                  )}
                  <View style={styles.priceRow}>
                    {item.appliedCoupon && (
                      <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                        Rs. {item.listing.price.toLocaleString()}
                      </Text>
                    )}
                    <Text style={[styles.price, { color: colors.teal }]}>
                      Rs. {item.finalPrice.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => handleRemove(item.listing.id)}
                      style={[styles.removeBtn, { borderColor: colors.destructive + "55" }]}
                    >
                      <Feather name="trash-2" size={14} color={colors.destructive} />
                      <Text style={[styles.removeBtnText, { color: colors.destructive }]}>Remove</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCheckout(item)}
                      disabled={checkingOut === item.listing.id}
                      style={[styles.buyBtn, { backgroundColor: checkingOut === item.listing.id ? colors.teal + "88" : colors.teal }]}
                    >
                      <Text style={[styles.buyBtnText, { color: colors.navy }]}>
                        {checkingOut === item.listing.id ? "Processing..." : "Buy Now"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Total Bar */}
          <View style={[styles.totalBar, { backgroundColor: colors.navyLight, borderTopColor: colors.border, paddingBottom: bottomPad + 16 }]}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                Total ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
              </Text>
              <Text style={[styles.totalPrice, { color: colors.gold }]}>
                Rs. {total.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (cartItems.length === 1) {
                  handleCheckout(cartItems[0]);
                } else {
                  Alert.alert(
                    "Checkout",
                    "Please checkout each item individually.",
                    [{ text: "OK" }]
                  );
                }
              }}
              style={[styles.checkoutBtn, { backgroundColor: colors.teal }]}
            >
              <Feather name="shopping-bag" size={18} color={colors.navy} />
              <Text style={[styles.checkoutBtnText, { color: colors.navy }]}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  clearText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  browseBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  browseBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cartCard: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  animalImage: { width: 100, height: "100%" as any },
  cardBody: { flex: 1, padding: 12, gap: 6 },
  animalTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  couponBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start",
  },
  couponText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  originalPrice: { fontSize: 12, fontFamily: "Inter_400Regular", textDecorationLine: "line-through" },
  price: { fontSize: 16, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  removeBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
  },
  removeBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  buyBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderRadius: 8, paddingVertical: 9,
  },
  buyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  totalBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1,
  },
  totalLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  totalPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  checkoutBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 20, paddingVertical: 13, borderRadius: 14,
  },
  checkoutBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
});
