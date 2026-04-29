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
import { useApp, type AnimalListing } from "../contexts/AppContext";
import { useColors } from "../hooks/useColors";

const ANIMAL_IMAGES: Record<string, any> = {
  goat_featured: require("../assets/images/goat_featured.png"),
  cow_featured: require("../assets/images/cow_featured.png"),
  sheep_featured: require("../assets/images/sheep_featured.png"),
};

interface AnimalCardProps {
  listing: AnimalListing;
  onPress: () => void;
  compact?: boolean;
}

export function AnimalCard({ listing, onPress, compact }: AnimalCardProps) {
  const colors = useColors();
  const { toggleFavorite, isFavorite } = useApp();
  const scale = useRef(new Animated.Value(1)).current;
  const favScale = useRef(new Animated.Value(1)).current;
  const isLiked = isFavorite(listing.id);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    Animated.sequence([
      Animated.timing(favScale, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(favScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleFavorite(listing.id);
  };

  const firstImage = listing.images[0] ?? "";
  const imageSource =
    typeof firstImage === "string" && /^https?:\/\//i.test(firstImage)
      ? { uri: firstImage }
      : ANIMAL_IMAGES[firstImage] ||
        ANIMAL_IMAGES[`${listing.category}_featured`] ||
        ANIMAL_IMAGES["goat_featured"];

  const categoryLabel: Record<string, string> = {
    goat: "Bakra",
    cow: "Cow",
    sheep: "Dumba",
    camel: "Camel",
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            width: compact ? 175 : undefined,
          },
        ]}
      >
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.navyMid + "ee" },
            ]}
          >
            <Text style={[styles.categoryText, { color: colors.teal }]}>
              {categoryLabel[listing.category]}
            </Text>
          </View>
          {listing.animalProperty && (
            <View
              style={[
                styles.propertyBadge,
                { backgroundColor: colors.gold + "ee" },
              ]}
            >
              <Text style={[styles.propertyText, { color: colors.navy }]}>
                {listing.animalProperty.toUpperCase()}
              </Text>
            </View>
          )}
          {listing.isFeatured && (
            <View
              style={[
                styles.featuredBadge,
                { backgroundColor: colors.gold + "ee" },
              ]}
            >
              <Feather name="star" size={10} color={colors.navy} />
              <Text style={[styles.featuredText, { color: colors.navy }]}>
                Featured
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.favButton,
              { backgroundColor: colors.navyMid + "cc" },
            ]}
            onPress={handleFavorite}
          >
            <Animated.View style={{ transform: [{ scale: favScale }] }}>
              <Feather
                name="heart"
                size={16}
                color={isLiked ? "#FF4B6E" : colors.starWhite}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {listing.title}
            </Text>
            <Text style={[styles.idText, { color: colors.mutedForeground }]}>
              #{listing.id}
            </Text>
          </View>
          <Text
            style={[styles.price, { color: colors.teal }]}
          >
            Rs. {listing.price.toLocaleString()}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Feather
                name="map-pin"
                size={11}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.metaText, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {listing.city}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather
                name="package"
                size={11}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.metaText, { color: colors.mutedForeground }]}
              >
                {listing.weight} kg
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 2,
  },
  imageContainer: {
    position: "relative",
    height: 140,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  propertyBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  propertyText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  favButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    marginRight: 4,
  },
  idText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    opacity: 0.8,
  },
  price: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  meta: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
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
});
