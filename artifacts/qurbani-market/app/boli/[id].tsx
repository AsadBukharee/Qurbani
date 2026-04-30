import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CountdownTimer } from "@/components/CountdownTimer";
import { useBoli } from "@/contexts/BoliContext";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatTimestamp, getTimeLeft } from "@/utils/countdown";

const ANIMAL_IMAGES: Record<string, any> = {
  goat_featured: require("../../assets/images/goat_featured.png"),
  cow_featured: require("../../assets/images/cow_featured.png"),
  sheep_featured: require("../../assets/images/sheep_featured.png"),
};

export default function BoliDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getBoliById, getBidsForBoli, placeBid } = useBoli();
  const { user } = useApp();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [bidInput, setBidInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);

  const listing = getBoliById(id ?? "");
  const bids = getBidsForBoli(id ?? "");

  if (!listing) {
    return (
      <View style={[styles.root, { backgroundColor: colors.navy }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Listing not found</Text>
      </View>
    );
  }

  const timeLeft = getTimeLeft(listing.endTime);
  const isActive = listing.status === "active" && !timeLeft.isExpired;
  const minNextBid = listing.currentPrice + listing.minIncrement;
  const imageSource =
    typeof listing.imageKey === "string" && /^https?:\/\//i.test(listing.imageKey)
      ? { uri: listing.imageKey }
      : ANIMAL_IMAGES[listing.imageKey] || ANIMAL_IMAGES["goat_featured"];
  const recentBids = bids.slice(0, 5);
  const isOwnListing = user?.id === listing.sellerId;

  const handlePlaceBid = async () => {
    Keyboard.dismiss();
    const amount = parseInt(bidInput.replace(/,/g, ""), 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Bid", "Please enter a valid bid amount.");
      return;
    }
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to place a bid.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    if (isOwnListing) {
      Alert.alert("Not Allowed", "You cannot bid on your own listing.");
      return;
    }
    setIsSubmitting(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    const result = await placeBid(listing.id, user.id, user.name, amount);
    setIsSubmitting(false);
    if (result.success) {
      setBidInput("");
      triggerSuccess();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert("Bid Failed", result.error || "Unable to place bid.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const triggerSuccess = () => {
    setShowSuccess(true);
    successScale.setValue(0);
    Animated.sequence([
      Animated.spring(successScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(successScale, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setShowSuccess(false));
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: "LIVE AUCTION", color: colors.teal },
    ended: { label: "AUCTION ENDED", color: colors.mutedForeground },
    sold: { label: "SOLD", color: colors.gold },
    expired: { label: "EXPIRED", color: colors.mutedForeground },
  };
  const statusInfo = statusMap[listing.status] ?? statusMap.ended;

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + 130 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />
          <View style={[styles.heroGradient, { backgroundColor: colors.navy + "aa" }]} />

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backBtn,
              {
                top: Platform.OS === "web" ? 67 + 12 : insets.top + 12,
                backgroundColor: colors.navyMid + "dd",
              },
            ]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "dd" }]}>
            {listing.status === "active" && <View style={[styles.liveDot, { backgroundColor: "#fff" }]} />}
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Title + Location */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.foreground }]}>{listing.animalTitle}</Text>
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={13} color={colors.mutedForeground} />
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{listing.city}</Text>
              <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>•</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{listing.weight}</Text>
              <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>•</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{listing.breed}</Text>
            </View>
          </View>

          {/* MAIN BID DISPLAY */}
          <View style={[styles.bidDisplay, { backgroundColor: colors.navyLight, borderColor: colors.gold + "55" }]}>
            <Text style={[styles.bidDisplayLabel, { color: colors.mutedForeground }]}>
              {listing.totalBids > 0 ? "Current Highest Bid" : "Starting Price"}
            </Text>
            <Text style={[styles.bidDisplayAmount, { color: colors.gold }]}>
              Rs. {listing.currentPrice.toLocaleString()}
            </Text>
            <View style={styles.bidStats}>
              <View style={styles.bidStat}>
                <Feather name="users" size={14} color={colors.mutedForeground} />
                <Text style={[styles.bidStatText, { color: colors.mutedForeground }]}>
                  {listing.totalBids} bid{listing.totalBids !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={[styles.bidStatDivider, { backgroundColor: colors.border }]} />
              <View style={styles.bidStat}>
                <Feather name="trending-up" size={14} color={colors.mutedForeground} />
                <Text style={[styles.bidStatText, { color: colors.mutedForeground }]}>
                  +Rs. {listing.minIncrement.toLocaleString()} min
                </Text>
              </View>
            </View>
          </View>

          {/* Countdown Timer */}
          <View style={[styles.timerCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Text style={[styles.timerLabel, { color: colors.mutedForeground }]}>
              {timeLeft.isExpired ? "Auction finished" : "Time Remaining"}
            </Text>
            <CountdownTimer endTime={listing.endTime} size="large" />
          </View>

          {/* Bid History */}
          {recentBids.length > 0 && (
            <View style={[styles.historyCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
              <View style={styles.historyHeader}>
                <Text style={[styles.historyTitle, { color: colors.foreground }]}>
                  Recent Bids
                </Text>
                <Text style={[styles.historyCount, { color: colors.mutedForeground }]}>
                  {listing.totalBids} total
                </Text>
              </View>
              {recentBids.map((bid, index) => (
                <View
                  key={bid.id}
                  style={[
                    styles.bidRow,
                    { borderBottomColor: colors.border },
                    index < recentBids.length - 1 && styles.bidRowBorder,
                  ]}
                >
                  <View style={[styles.bidAvatar, { backgroundColor: index === 0 ? colors.gold + "22" : colors.navyMid }]}>
                    <Text style={[styles.bidAvatarText, { color: index === 0 ? colors.gold : colors.mutedForeground }]}>
                      {bid.userName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.bidInfo}>
                    <Text style={[styles.bidderName, { color: index === 0 ? colors.gold : colors.foreground }]}>
                      {bid.userName}
                      {index === 0 && " 👑"}
                    </Text>
                    <Text style={[styles.bidTime, { color: colors.mutedForeground }]}>
                      {formatTimestamp(bid.timestamp)}
                    </Text>
                  </View>
                  <Text style={[styles.bidAmt, { color: index === 0 ? colors.gold : colors.foreground }]}>
                    Rs. {bid.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Specs */}
          <View style={[styles.specsCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Text style={[styles.specsTitle, { color: colors.gold }]}>Animal Details</Text>
            <View style={styles.specsGrid}>
              {[
                { icon: "package", label: "Weight", value: listing.weight },
                { icon: "clock", label: "Age", value: listing.age },
                { icon: "tag", label: "Breed", value: listing.breed },
                { icon: "map-pin", label: "City", value: listing.city },
              ].map((spec) => (
                <View key={spec.label} style={[styles.specItem, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
                  <Feather name={spec.icon as any} size={14} color={colors.teal} />
                  <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{spec.label}</Text>
                  <Text style={[styles.specValue, { color: colors.foreground }]}>{spec.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={[styles.descCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Text style={[styles.descTitle, { color: colors.foreground }]}>About this animal</Text>
            <Text style={[styles.descText, { color: colors.mutedForeground }]}>{listing.description}</Text>
          </View>

          {/* Seller */}
          <View style={[styles.sellerCard, { backgroundColor: colors.navyLight, borderColor: colors.gold + "33" }]}>
            <Text style={[styles.sellerLabel, { color: colors.gold }]}>Seller</Text>
            <View style={styles.sellerRow}>
              <View style={[styles.sellerAvatar, { backgroundColor: colors.teal + "22", borderColor: colors.teal }]}>
                <Text style={[styles.sellerAvatarText, { color: colors.teal }]}>
                  {listing.sellerName.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerName, { color: colors.foreground }]}>{listing.sellerName}</Text>
                <Text style={[styles.sellerPhone, { color: colors.mutedForeground }]}>{listing.sellerPhone}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Bid CTA Bar */}
      {isActive && !isOwnListing && (
        <View
          style={[
            styles.ctaBar,
            {
              backgroundColor: colors.navyLight,
              borderTopColor: colors.gold + "44",
              paddingBottom: bottomPad + 12,
            },
          ]}
        >
          <Text style={[styles.ctaMinLabel, { color: colors.mutedForeground }]}>
            Min: Rs. {minNextBid.toLocaleString()}
          </Text>
          <View style={styles.ctaRow}>
            <View style={[styles.bidInputWrap, { backgroundColor: colors.navyMid, borderColor: colors.gold + "55" }]}>
              <Text style={[styles.rupeeSign, { color: colors.gold }]}>Rs.</Text>
              <TextInput
                style={[styles.bidInputField, { color: colors.gold }]}
                placeholder={minNextBid.toLocaleString()}
                placeholderTextColor={colors.mutedForeground}
                value={bidInput}
                onChangeText={setBidInput}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              onPress={handlePlaceBid}
              disabled={isSubmitting}
              style={[
                styles.placeBidBtn,
                { backgroundColor: isSubmitting ? colors.gold + "88" : colors.gold },
              ]}
            >
              {isSubmitting ? (
                <Text style={[styles.placeBidText, { color: colors.navy }]}>Placing...</Text>
              ) : (
                <>
                  <Feather name="trending-up" size={18} color={colors.navy} />
                  <Text style={[styles.placeBidText, { color: colors.navy }]}>Place Bid</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isActive && isOwnListing && (
        <View style={[styles.ownListingBar, { backgroundColor: colors.navyLight, borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
          <Feather name="info" size={16} color={colors.mutedForeground} />
          <Text style={[styles.ownListingText, { color: colors.mutedForeground }]}>
            This is your listing — you cannot bid on it.
          </Text>
        </View>
      )}

      {!isActive && (
        <View style={[styles.endedBar, { backgroundColor: colors.navyLight, borderTopColor: colors.border, paddingBottom: bottomPad + 12 }]}>
          <Feather name="clock" size={16} color={colors.mutedForeground} />
          <Text style={[styles.endedText, { color: colors.mutedForeground }]}>
            {listing.status === "sold"
              ? `Sold to ${listing.totalBids} bidder(s) — Auction ended`
              : "This auction has ended"}
          </Text>
        </View>
      )}

      {/* Success Animation */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successOverlay,
            { transform: [{ scale: successScale }] },
            { backgroundColor: colors.gold + "22", borderColor: colors.gold },
          ]}
          pointerEvents="none"
        >
          <Feather name="check-circle" size={40} color={colors.gold} />
          <Text style={[styles.successText, { color: colors.gold }]}>Bid Placed!</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Rs. {parseInt(bidInput || "0").toLocaleString()} bid submitted
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { textAlign: "center", marginTop: 120, fontSize: 15, fontFamily: "Inter_400Regular" },
  heroContainer: { height: 260, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    bottom: 14,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  content: { padding: 20, gap: 16 },
  titleSection: { gap: 4 },
  title: { fontSize: 21, fontFamily: "Inter_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  meta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  metaDot: { fontSize: 13 },
  bidDisplay: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bidDisplayLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  bidDisplayAmount: { fontSize: 38, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  bidStats: { flexDirection: "row", alignItems: "center", gap: 16 },
  bidStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  bidStatText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bidStatDivider: { width: 1, height: 16 },
  timerCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  timerLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  historyCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  historyCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  bidRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  bidRowBorder: { borderBottomWidth: 1 },
  bidAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  bidAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  bidInfo: { flex: 1 },
  bidderName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  bidTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  bidAmt: { fontSize: 14, fontFamily: "Inter_700Bold" },
  specsCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  specsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specItem: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 10, gap: 3 },
  specLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  specValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  descCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  descTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  descText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },
  sellerCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sellerLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  sellerAvatarText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sellerName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sellerPhone: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  ctaBar: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  ctaMinLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ctaRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  bidInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  rupeeSign: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  bidInputField: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  placeBidBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14 },
  placeBidText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  ownListingBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  ownListingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  endedBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
  endedText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  successOverlay: { position: "absolute", alignSelf: "center", top: "35%", borderRadius: 20, borderWidth: 1.5, padding: 28, alignItems: "center", gap: 10 },
  successText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  successSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
