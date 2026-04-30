import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CountdownTimer } from "./CountdownTimer";
import { useColors } from "../hooks/useColors";
import type { BoliListing } from "../contexts/BoliContext";

const ANIMAL_IMAGES: Record<string, any> = {
  goat_featured: require("../assets/images/goat_featured.png"),
  cow_featured: require("../assets/images/cow_featured.png"),
  sheep_featured: require("../assets/images/sheep_featured.png"),
};

interface BoliCardProps {
  listing: BoliListing;
  onPress: () => void;
}

export function BoliCard({ listing, onPress }: BoliCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const imageSource =
    typeof listing.imageKey === "string" && /^https?:\/\//i.test(listing.imageKey)
      ? { uri: listing.imageKey }
      : ANIMAL_IMAGES[listing.imageKey] || ANIMAL_IMAGES["goat_featured"];
  const isActive = listing.status === "active";
  const nextMinBid = listing.currentPrice + listing.minIncrement;
  const hasBids = listing.totalBids > 0;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const statusLabel: Record<string, string> = {
    active: "LIVE",
    ended: "ENDED",
    sold: "SOLD",
    expired: "EXPIRED",
  };
  const statusColor: Record<string, string> = {
    active: colors.teal,
    ended: colors.mutedForeground,
    sold: colors.gold,
    expired: colors.mutedForeground,
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: colors.navyLight,
            borderColor: isActive ? colors.gold + "44" : colors.border,
            shadowColor: isActive ? colors.gold : "transparent",
          },
        ]}
      >
        {/* Glow Border for active */}
        {isActive && (
          <View style={[styles.glowBorder, { borderColor: colors.gold + "22" }]} />
        )}

        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor[listing.status] + "dd" }]}>
            {listing.status === "active" && (
              <View style={[styles.liveDot, { backgroundColor: "#fff" }]} />
            )}
            <Text style={styles.statusText}>{statusLabel[listing.status]}</Text>
          </View>
          {/* Timer */}
          {listing.status === "active" && (
            <View style={styles.timerOverlay}>
              <CountdownTimer endTime={listing.endTime} size="small" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {listing.animalTitle}
          </Text>

          {/* Bid info row */}
          <View style={styles.bidRow}>
            <View>
              <Text style={[styles.bidLabel, { color: colors.mutedForeground }]}>
                {hasBids ? "Highest Bid" : "Starting Price"}
              </Text>
              <Text style={[styles.bidAmount, { color: colors.gold }]}>
                Rs. {listing.currentPrice.toLocaleString()}
              </Text>
            </View>
            <View style={styles.bidsInfo}>
              <Feather name="users" size={12} color={colors.mutedForeground} />
              <Text style={[styles.bidsCount, { color: colors.mutedForeground }]}>
                {listing.totalBids} bid{listing.totalBids !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          {/* Min increment */}
          {isActive && (
            <Text style={[styles.minBid, { color: colors.mutedForeground }]}>
              Min next bid: Rs. {nextMinBid.toLocaleString()}
            </Text>
          )}

          {/* Location + Weight */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{listing.city}</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="package" size={11} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{listing.weight}</Text>
            </View>
          </View>

          {isActive && (
            <View style={[styles.bidBtn, { backgroundColor: colors.gold + "18", borderColor: colors.gold + "55" }]}>
              <Feather name="trending-up" size={14} color={colors.gold} />
              <Text style={[styles.bidBtnText, { color: colors.gold }]}>Place Bid</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  glowBorder: {
    position: "absolute",
    inset: -2,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 0,
  },
  imageContainer: {
    height: 165,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  timerOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  info: {
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bidLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  bidAmount: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  bidsInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bidsCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  minBid: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  bidBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 9,
    marginTop: 2,
  },
  bidBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
