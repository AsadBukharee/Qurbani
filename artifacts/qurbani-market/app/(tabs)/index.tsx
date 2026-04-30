import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimalCard } from "@/components/AnimalCard";
import { BoliCard } from "@/components/BoliCard";
import { CategoryGrid } from "@/components/CategoryGrid";
import { StarryBackground } from "@/components/StarryBackground";
import { LocationFormSheet } from "@/components/LocationFormSheet";
import { SettingsDrawer } from "@/components/SettingsDrawer";
import { useApp } from "@/contexts/AppContext";
import { useBoli } from "@/contexts/BoliContext";
import { useLocation } from "@/contexts/LocationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { useT, useUrduTextStyle } from "@/lib/i18n";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURED_IMAGES = [
  {
    id: "f1",
    labelKey: "home.featured.eid.label",
    subKey: "home.featured.eid.sub",
    image: require("../../assets/images/goat_featured.png"),
  },
  {
    id: "f2",
    labelKey: "home.featured.karwan.label",
    subKey: "home.featured.karwan.sub",
    image: require("../../assets/images/karwan.png"),
  },
  {
    id: "f3",
    labelKey: "home.featured.dumba.label",
    subKey: "home.featured.dumba.sub",
    image: require("../../assets/images/sheep_featured.png"),
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listings, favorites } = useApp();
  const { boliListings } = useBoli();
  const { location } = useLocation();
  const { theme } = useTheme();
  const t = useT();
  const urdu = useUrduTextStyle();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeBoliListings = boliListings.filter((l) => l.status === "active").slice(0, 3);
  const [activeBanner, setActiveBanner] = useState(0);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const carouselRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Default behavior: when no search query is entered, prefer animals near the
  // user's saved city. As soon as the user types, search across all listings.
  const userCity = location?.city?.trim().toLowerCase() ?? "";
  const filteredListings = listings.filter((l) => {
    const q = search.trim().toLowerCase();
    if (q) {
      const matchesSearch =
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.breed.toLowerCase().includes(q);
      const matchesCat = !selectedCategory || l.category === selectedCategory;
      return matchesSearch && matchesCat;
    }
    const matchesCat = !selectedCategory || l.category === selectedCategory;
    const matchesNearby =
      !userCity || l.city.toLowerCase() === userCity;
    return matchesCat && matchesNearby;
  });

  const featuredListings = listings.filter((l) => l.isFeatured);

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {theme === "dark" && <StarryBackground />}
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.bismillah, { color: "#614603" }]}>
              بِسْمِ اللّٰهِ
            </Text>
            <Text style={[styles.appTitle, { color: colors.foreground }]}>
              Qurbani Market
            </Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Buy & Sell Sacrificial Animals
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setLocationPickerOpen(true)}
              style={[styles.locationPill, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "55" }]}
            >
              <Feather name="map-pin" size={12} color={colors.gold} />
              <Text style={[styles.locationText, { color: colors.gold }, urdu]} numberOfLines={1}>
                {location?.city || t("home.setLocation")}
              </Text>
              <Feather name="chevron-down" size={11} color={colors.gold} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => router.push("/notifications")}
                style={[styles.headerIconBtn, { backgroundColor: colors.navyMid, borderColor: colors.border }]}
              >
                <Feather name="bell" size={18} color={colors.teal} />
                <View style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold }} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSettingsOpen(true)}
                style={[styles.headerIconBtn, { backgroundColor: colors.navyMid, borderColor: colors.border }]}
              >
                <Feather name="menu" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar — no filter button on home; tap "Search" tab for full filters */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.navyLight, borderColor: colors.border },
            ]}
          >
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder={
                location?.city
                  ? `${t("common.search")} — ${location.city}`
                  : t("home.searchPlaceholder")
              }
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (search.trim()) {
                  router.push({
                    pathname: "/(tabs)/listings",
                    params: { q: search.trim() },
                  });
                }
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          {!search && location?.city && (
            <View style={styles.nearbyHintRow}>
              <Feather name="map-pin" size={11} color={colors.teal} />
              <Text style={[styles.nearbyHintText, { color: colors.mutedForeground }]}>
                Showing animals near <Text style={{ color: colors.teal, fontFamily: "Inter_600SemiBold" }}>{location.city}</Text> · Use the Search tab for filters
              </Text>
            </View>
          )}
        </View>

        {/* Banner Carousel */}
        <View style={styles.section}>
          <FlatList
            ref={carouselRef}
            data={FEATURED_IMAGES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH - 40}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 40)
              );
              setActiveBanner(idx);
            }}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bannerCard,
                  {
                    width: SCREEN_WIDTH - 40,
                    backgroundColor: colors.navyLight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
                <View
                  style={[
                    styles.bannerOverlay,
                    { backgroundColor: colors.navy + "99" },
                  ]}
                >
                  <Text style={[styles.bannerTitle, { color: colors.gold }, urdu]}>
                    ☽ {t(item.labelKey)}
                  </Text>
                  <Text
                    style={[styles.bannerSub, { color: colors.starWhite }, urdu]}
                  >
                    {t(item.subKey)}
                  </Text>
                </View>
              </View>
            )}
          />
          {/* Dots */}
          <View style={styles.dotsRow}>
            {FEATURED_IMAGES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeBanner ? colors.teal : colors.border,
                    width: i === activeBanner ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionTitle title={t("home.categories")} colors={colors} urdu={urdu} />
          <CategoryGrid
            onSelect={(cat) => setSelectedCategory(cat || null)}
            selected={selectedCategory}
          />
        </View>

        {/* Boli Live Auctions Section */}
        {!search && !selectedCategory && activeBoliListings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <View style={styles.boliTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Live Boli</Text>
                <Text style={[styles.boliAr, { color: colors.gold }]}>بولی</Text>
                <View style={[styles.livePill, { backgroundColor: "#FF4B6E22", borderColor: "#FF4B6E66" }]}>
                  <View style={[styles.liveDot, { backgroundColor: "#FF4B6E" }]} />
                  <Text style={[styles.liveText, { color: "#FF4B6E" }]}>LIVE</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/boli")}>
                <Text style={[styles.seeAll, { color: colors.gold }]}>View all</Text>
              </TouchableOpacity>
            </View>
            {/* Boli CTA Banner */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/boli")}
              style={[styles.boliHeroBanner, { backgroundColor: colors.navyLight, borderColor: colors.gold + "55" }]}
            >
              <View style={styles.boliHeroLeft}>
                <Text style={[styles.boliHeroTitle, { color: colors.gold }]}>Bid on Animals</Text>
                <Text style={[styles.boliHeroSub, { color: colors.mutedForeground }]}>
                  Place bids on live auctions — highest bid wins!
                </Text>
                <View style={[styles.boliHeroBtn, { backgroundColor: colors.gold }]}>
                  <Feather name="trending-up" size={13} color={colors.navy} />
                  <Text style={[styles.boliHeroBtnText, { color: colors.navy }]}>Join Boli</Text>
                </View>
              </View>
              <View style={styles.boliHeroRight}>
                <Text style={styles.boliHeroEmoji}>☽</Text>
                <Text style={[styles.boliHeroCount, { color: colors.foreground }]}>
                  {activeBoliListings.length}
                </Text>
                <Text style={[styles.boliHeroCountLabel, { color: colors.mutedForeground }]}>
                  live auction{activeBoliListings.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </TouchableOpacity>
            {/* Boli cards horizontal */}
            <FlatList
              data={activeBoliListings}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              renderItem={({ item }) => (
                <View style={{ width: SCREEN_WIDTH * 0.72 }}>
                  <BoliCard listing={item} onPress={() => router.push(`/boli/${item.id}`)} />
                </View>
              )}
            />
          </View>
        )}

        {/* Featured Listings */}
        {!search && !selectedCategory && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <SectionTitle title={t("home.recentListings")} colors={colors} urdu={urdu} />
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/listings")}
              >
                <Text style={[styles.seeAll, { color: colors.teal }, urdu]}>
                  {t("home.viewAll")}
                </Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredListings}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12, paddingRight: 4 }}
              renderItem={({ item }) => (
                <AnimalCard
                  listing={item}
                  compact
                  onPress={() => router.push(`/animal/${item.id}`)}
                />
              )}
            />
          </View>
        )}

        {/* All / Filtered Listings */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <SectionTitle
              title={
                selectedCategory
                  ? `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}s`
                  : search
                    ? t("common.search")
                    : t("home.recentListings")
              }
              colors={colors}
              urdu={urdu}
            />
            <Text style={[styles.countBadge, { color: colors.mutedForeground }, urdu]}>
              {filteredListings.length}
            </Text>
          </View>
          {filteredListings.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="search" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }, urdu]}>
                {t("home.noListings")}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredListings.map((item) => (
                <View key={item.id} style={styles.gridItem}>
                  <AnimalCard
                    listing={item}
                    onPress={() => router.push(`/animal/${item.id}`)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <LocationFormSheet
        visible={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
      />

      {/* Floating Sell Button */}
      <TouchableOpacity
        onPress={() => router.push("/my-ads")}
        style={[
          styles.fab,
          {
            backgroundColor: "#876009",
            bottom: bottomPad + 80,
            shadowColor: "#876009",
          },
        ]}
      >
        <Text style={[styles.fabText, { color: colors.navy }]}>Sell</Text>
      </TouchableOpacity>

      {/* Settings Drawer */}
      <SettingsDrawer visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

function SectionTitle({ title, colors, urdu }: { title: string; colors: any; urdu?: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: colors.foreground }, urdu]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  bismillah: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
    letterSpacing: 1,
  },
  appTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  headerRight: {
    alignItems: "flex-end",
    paddingTop: 4,
    gap: 8,
    flexShrink: 1,
  },
  eidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  eidText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 130,
    alignSelf: "flex-end",
  },
  locationText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  nearbyHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  nearbyHintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
  },
  iconBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "white",
  },
  propertyFilters: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  propChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  propChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  boliTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  boliAr: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  boliHeroBanner: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  boliHeroLeft: {
    flex: 1,
    gap: 6,
  },
  boliHeroTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  boliHeroSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    maxWidth: 180,
  },
  boliHeroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 2,
  },
  boliHeroBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  boliHeroRight: {
    alignItems: "center",
    paddingLeft: 16,
  },
  boliHeroEmoji: {
    fontSize: 32,
  },
  boliHeroCount: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  boliHeroCountLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  countBadge: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  bannerCard: {
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  bannerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  grid: {
    gap: 12,
  },
  gridItem: {
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
