import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CouponCode, useApp } from "@/contexts/AppContext";
import { useCart } from "@/contexts/CartContext";
import { useColors } from "@/hooks/useColors";
import { apiErrorMessage, chat as chatApi, isApiEnabled } from "@/lib/api";

const ANIMAL_IMAGES: Record<string, any> = {
  goat_featured: require("../../assets/images/goat_featured.png"),
  cow_featured: require("../../assets/images/cow_featured.png"),
  sheep_featured: require("../../assets/images/sheep_featured.png"),
};

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listings, toggleFavorite, isFavorite, validateCoupon, user, isAuthenticated } = useApp();
  const { addToCart, isInCart, checkout, addPurchase } = useCart();
  const favScale = useRef(new Animated.Value(1)).current;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponCode | null>(null);
  const [couponError, setCouponError] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const listing = listings.find((l) => l.id === id);
  const isLiked = id ? isFavorite(id) : false;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get("window");

  const handleStartChat = async () => {
    if (!listing) return;
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to message the seller.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    if (!isApiEnabled()) {
      Alert.alert("Unavailable", "Chat is not available in offline mode.");
      return;
    }
    if (listing.seller.id === user?.id) {
      Alert.alert("That's your listing", "You can't message yourself.");
      return;
    }
    if (!listing.seller.id || listing.id.startsWith("local-")) {
      Alert.alert(
        "Sample Listing",
        "Messaging is only available for live listings."
      );
      return;
    }
    setChatLoading(true);
    try {
      const room = await chatApi.open(listing.seller.id, listing.id);
      const roomId = (room as any)?.id;
      if (!roomId) throw new Error("No room id returned");
      router.push({
        pathname: "/chat/[id]",
        params: { id: String(roomId), peer: listing.seller.name },
      });
    } catch (err) {
      Alert.alert("Could Not Start Chat", apiErrorMessage(err));
    } finally {
      setChatLoading(false);
    }
  };

  if (!listing) {
    return (
      <View style={[styles.root, { backgroundColor: colors.navy }]}>
        <Text style={[styles.notFound, { color: colors.foreground }]}>
          Listing not found
        </Text>
      </View>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [`${listing.category}_featured`];

  const getImageSource = (img: string) => {
    return typeof img === "string" && /^https?:\/\//i.test(img)
      ? { uri: img }
      : ANIMAL_IMAGES[img] ||
          ANIMAL_IMAGES[`${listing.category}_featured`] ||
          ANIMAL_IMAGES["goat_featured"];
  };

  const handleCall = () => {
    const url = `tel:${listing.seller.phone}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else Alert.alert("Unable to place call");
    });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Assalamu Alaikum, I'm interested in your listing: "${listing.title}" priced at Rs. ${listing.price.toLocaleString()}. Is it still available?`
    );
    const url = `https://wa.me/${listing.seller.whatsapp.replace(/[^0-9]/g, "")}?text=${msg}`;
    Linking.openURL(url).catch(() => Alert.alert("WhatsApp not installed"));
  };

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(favScale, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(favScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleFavorite(listing.id);
  };

  const categoryLabel: Record<string, string> = {
    goat: "Bakra (Goat)",
    cow: "Gaye (Cow)",
    sheep: "Dumba (Sheep)",
    camel: "Oont (Camel)",
  };

  const discountedPrice = appliedCoupon
    ? Math.round(listing ? listing.price * (1 - appliedCoupon.discount / 100) : 0)
    : null;

  const handleApplyCoupon = () => {
    if (!listing) return;
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    const found = validateCoupon(code, listing.seller.id);
    if (found) {
      setAppliedCoupon(found);
      setCouponError("");
    } else {
      setAppliedCoupon(null);
      setCouponError("Invalid or expired coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const handleAddToCart = () => {
    if (!listing) return;
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to add items to cart.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    const coupon = appliedCoupon
      ? { code: appliedCoupon.code, discount: appliedCoupon.discount }
      : null;
    addToCart(listing, coupon);
    setCartAdded(true);
    Alert.alert(
      "Added to Cart",
      `${listing.title} has been added to your cart.`,
      [
        { text: "Continue Shopping", style: "cancel" },
        { text: "View Cart", onPress: () => router.push("/cart") },
      ]
    );
  };

  const handleBuyNow = async () => {
    if (!listing) return;
    if (!isAuthenticated) {
      Alert.alert("Sign In Required", "Please sign in to purchase animals.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    setBuyLoading(true);
    try {
      const coupon = appliedCoupon
        ? { code: appliedCoupon.code, discount: appliedCoupon.discount }
        : null;
      const finalPrice = coupon
        ? Math.round(listing.price * (1 - coupon.discount / 100))
        : listing.price;
      const cartItem = { listing, addedAt: new Date().toISOString(), appliedCoupon: coupon, finalPrice };
      const purchase = checkout(cartItem);
      addPurchase(purchase);
      router.push({ pathname: "/invoice/[id]", params: { id: purchase.id } });
    } catch (err) {
      Alert.alert("Purchase Failed", apiErrorMessage(err));
    } finally {
      setBuyLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Carousel */}
        <View style={styles.heroContainer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(index);
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            renderItem={({ item }) => (
              <View style={{ width }}>
                <Image source={getImageSource(item)} style={styles.heroImage} resizeMode="cover" />
              </View>
            )}
            keyExtractor={(_, i) => String(i)}
          />
          <View style={[styles.heroOverlay, { backgroundColor: colors.navy + "33" }]} pointerEvents="none" />

          {/* Pagination dots */}
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.paginationDot,
                    {
                      backgroundColor: i === activeIndex ? colors.teal : colors.foreground + "55",
                      width: i === activeIndex ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Back + Fav buttons */}
          <View
            style={[
              styles.topBar,
              {
                paddingTop:
                  Platform.OS === "web" ? 67 + 12 : insets.top + 12,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.iconBtn, { backgroundColor: colors.navyMid + "dd" }]}
            >
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFavorite}
              style={[styles.iconBtn, { backgroundColor: colors.navyMid + "dd" }]}
            >
              <Animated.View style={{ transform: [{ scale: favScale }] }}>
                <Feather
                  name="heart"
                  size={20}
                  color={isLiked ? "#FF4B6E" : colors.foreground}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Category badge */}
          <View
            style={[
              styles.catBadge,
              { backgroundColor: colors.navyMid + "ee" },
            ]}
          >
            <Text style={[styles.catBadgeText, { color: colors.teal }]}>
              {categoryLabel[listing.category]}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.content, { backgroundColor: colors.navy }]}>
          {/* Title & Price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleWithId}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {listing.title}
                </Text>
                <Text style={[styles.idBadge, { color: colors.mutedForeground }]}>
                  #{listing.id}
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={13} color={colors.mutedForeground} />
                <Text style={[styles.location, { color: colors.mutedForeground }]}>
                  {listing.city}
                </Text>
                <Text style={[styles.dot, { color: colors.mutedForeground }]}>•</Text>
                <Text style={[styles.date, { color: colors.mutedForeground }]}>
                  {listing.createdAt}
                </Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              {appliedCoupon && (
                <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                  Rs. {listing.price.toLocaleString()}
                </Text>
              )}
              <Text style={[styles.price, { color: appliedCoupon ? colors.gold : colors.teal }]}>
                Rs. {(discountedPrice ?? listing.price).toLocaleString()}
              </Text>
              {appliedCoupon && (
                <View style={[styles.savingsBadge, { backgroundColor: colors.gold + "22" }]}>
                  <Text style={[styles.savingsText, { color: colors.gold }]}>
                    {appliedCoupon.discount}% OFF
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Coupon Code */}
          <View style={[styles.couponCard, { backgroundColor: colors.navyLight, borderColor: appliedCoupon ? colors.gold + "55" : colors.border }]}>
            <View style={styles.couponHeader}>
              <Feather name="tag" size={15} color={colors.gold} />
              <Text style={[styles.couponTitle, { color: colors.foreground }]}>Have a Coupon Code?</Text>
            </View>

            {appliedCoupon ? (
              <View style={styles.appliedRow}>
                <View style={[styles.appliedBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}>
                  <Feather name="check-circle" size={14} color={colors.gold} />
                  <Text style={[styles.appliedCode, { color: colors.gold }]}>{appliedCoupon.code}</Text>
                  <Text style={[styles.appliedDiscount, { color: colors.gold }]}>— {appliedCoupon.discount}% off applied!</Text>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeBtn}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputRow}>
                <TextInput
                  value={couponInput}
                  onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(""); }}
                  placeholder="Enter code"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  style={[styles.couponInput, { backgroundColor: colors.navy, color: colors.foreground, borderColor: couponError ? colors.destructive + "88" : colors.border }]}
                />
                <TouchableOpacity
                  onPress={handleApplyCoupon}
                  style={[styles.applyBtn, { backgroundColor: colors.teal }]}
                >
                  <Text style={[styles.applyBtnText, { color: colors.navy }]}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}

            {couponError ? (
              <Text style={[styles.couponError, { color: colors.destructive }]}>{couponError}</Text>
            ) : null}
          </View>

          {/* Specs Grid */}
          <View style={[styles.specsCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Text style={[styles.specsTitle, { color: colors.gold }]}>Animal Details</Text>
            <View style={styles.specsGrid}>
              {[
                { icon: "package", label: "Weight", value: `${listing.weight} kg` },
                { icon: "clock", label: "Age", value: listing.age },
                { icon: "tag", label: "Breed", value: listing.breed },
                { icon: "map-pin", label: "City", value: listing.city },
              ].map((spec) => (
                <View
                  key={spec.label}
                  style={[
                    styles.specItem,
                    { backgroundColor: colors.navyMid, borderColor: colors.border },
                  ]}
                >
                  <Feather name={spec.icon as any} size={16} color={colors.teal} />
                  <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>
                    {spec.label}
                  </Text>
                  <Text style={[styles.specValue, { color: colors.foreground }]}>
                    {spec.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          {listing.description ? (
            <View style={[styles.descCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
              <Text style={[styles.descTitle, { color: colors.foreground }]}>
                About this animal
              </Text>
              <Text style={[styles.descText, { color: colors.mutedForeground }]}>
                {listing.description}
              </Text>
            </View>
          ) : null}

          {/* Seller */}
          <View style={[styles.sellerCard, { backgroundColor: colors.navyLight, borderColor: colors.gold + "33" }]}>
            <Text style={[styles.sellerHeading, { color: colors.gold }]}>Seller</Text>
            <View style={styles.sellerRow}>
              <View style={[styles.sellerAvatar, { backgroundColor: colors.teal + "22", borderColor: colors.teal }]}>
                <Text style={[styles.sellerAvatarText, { color: colors.teal }]}>
                  {listing.seller.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={[styles.sellerName, { color: colors.foreground }]}>
                  {listing.seller.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={12} color={colors.gold} />
                  <Text style={[styles.rating, { color: colors.gold }]}>
                    {listing.seller.rating} ({listing.seller.totalSales} sales)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed CTA Buttons */}
      <View
        style={[
          styles.ctaBar,
          {
            backgroundColor: colors.navyLight,
            borderTopColor: colors.border,
            paddingBottom: bottomPad + 12,
          },
        ]}
      >
        {/* Row 1: Buy Now + Add to Cart */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            onPress={handleBuyNow}
            disabled={buyLoading}
            style={[styles.buyNowBtn, { backgroundColor: buyLoading ? colors.teal + "88" : colors.teal }]}
          >
            <Feather name="shopping-bag" size={18} color={colors.navy} />
            <Text style={[styles.buyNowText, { color: colors.navy }]}>
              {buyLoading ? "Processing…" : "Buy Now"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={isInCart(listing.id)}
            style={[
              styles.addCartBtn,
              {
                backgroundColor: isInCart(listing.id) ? colors.gold + "22" : colors.navyMid,
                borderColor: isInCart(listing.id) ? colors.gold : colors.border,
              },
            ]}
          >
            <Feather name="shopping-cart" size={18} color={isInCart(listing.id) ? colors.gold : colors.foreground} />
            <Text style={[styles.addCartText, { color: isInCart(listing.id) ? colors.gold : colors.foreground }]}>
              {isInCart(listing.id) ? "In Cart" : "Add to Cart"}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Row 2: Contact options */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            onPress={handleCall}
            style={[styles.callBtn, { backgroundColor: colors.navyMid, borderColor: colors.teal + "66" }]}
          >
            <Feather name="phone" size={16} color={colors.teal} />
            <Text style={[styles.callBtnText, { color: colors.teal }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleStartChat}
            disabled={chatLoading}
            style={[styles.callBtn, { backgroundColor: colors.navyMid, borderColor: colors.border }]}
          >
            <Feather name="message-square" size={16} color={colors.foreground} />
            <Text style={[styles.callBtnText, { color: colors.foreground }]}>
              {chatLoading ? "…" : "Chat"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={[styles.whatsappBtn, { backgroundColor: "#25D366" }]}
          >
            <Feather name="message-circle" size={16} color="white" />
            <Text style={styles.whatsappBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 100,
    fontFamily: "Inter_400Regular",
  },
  heroContainer: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  catBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  catBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  titleWithId: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  idBadge: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    opacity: 0.7,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  dot: {
    fontSize: 13,
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  pagination: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  price: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  priceBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  originalPrice: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "line-through",
  },
  savingsBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  savingsText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  couponCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  couponTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  couponInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  applyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appliedBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  appliedCode: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  appliedDiscount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  couponError: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  specsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  specsTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specItem: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  specLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  specValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  descCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  descTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  descText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  sellerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sellerHeading: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerAvatarText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  sellerInfo: {
    flex: 1,
    gap: 4,
  },
  sellerName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  ctaBar: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 8,
  },
  buyNowBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buyNowText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  addCartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  addCartText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  callBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
  },
  whatsappBtnText: {
    color: "white",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
