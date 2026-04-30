import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
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
import {
  DEFAULT_FILTERS,
  FilterModal,
  type AdvancedFilters,
  type SortKey,
} from "@/components/FilterModal";
import { StarryBackground } from "@/components/StarryBackground";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "goat", label: "Bakra" },
  { id: "cow", label: "Cow" },
  { id: "sheep", label: "Sheep" },
  { id: "dumba", label: "Dumba" },
  { id: "camel", label: "Camel" },
  { id: "buffalo", label: "Buffalo" },
];

const PROPERTY_CHIPS = [
  { id: "khasi", label: "Khasi", labelAr: "خصی" },
  { id: "andal", label: "Andal", labelAr: "انڈال" },
];

const QUICK_SORT: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price_low", label: "Price ↑" },
  { id: "price_high", label: "Price ↓" },
];

// Parse a leading number from age strings like "8 months", "2 years",
// "2.5y", "1.5 years". Returns the value normalised to months.
function parseAgeMonths(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.toString().toLowerCase().match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (Number.isNaN(num)) return null;
  // If "year" appears, assume years; otherwise months.
  return /year|yr|سال/.test(raw.toString().toLowerCase()) ? num * 12 : num;
}

export default function ListingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listings } = useApp();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeProperties, setActiveProperties] = useState<string[]>([]);

  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<AdvancedFilters>(DEFAULT_FILTERS);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const toggleProperty = (id: string) => {
    setActiveProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const setSort = (sort: SortKey) =>
    setAdvancedFilters((prev) => ({ ...prev, sort }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const breedQ = advancedFilters.breed.trim().toLowerCase();
    const minP = parseInt(advancedFilters.minPrice, 10);
    const maxP = parseInt(advancedFilters.maxPrice, 10);
    const minW = parseInt(advancedFilters.minWeight, 10);
    const maxW = parseInt(advancedFilters.maxWeight, 10);
    const minA = parseInt(advancedFilters.minAge, 10);
    const maxA = parseInt(advancedFilters.maxAge, 10);

    let result = listings.filter((l) => {
      // Free-text search across multiple fields
      if (q) {
        const haystack = [
          l.title,
          l.city,
          l.province,
          l.district,
          l.breed,
          l.age,
          l.description,
          l.seller?.name,
          ...(l.keywords ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Category chip
      if (activeFilter !== "all" && l.category !== activeFilter) return false;

      // Property chips
      if (
        activeProperties.length > 0 &&
        (l.animalProperty == null ||
          !activeProperties.includes(l.animalProperty))
      ) {
        return false;
      }

      // Breed (substring match)
      if (breedQ && !(l.breed ?? "").toLowerCase().includes(breedQ)) {
        return false;
      }

      // Location
      if (
        advancedFilters.city &&
        l.city.toLowerCase() !== advancedFilters.city.toLowerCase()
      ) {
        return false;
      }
      if (
        advancedFilters.province &&
        (l.province ?? "").toLowerCase() !==
          advancedFilters.province.toLowerCase()
      ) {
        return false;
      }

      // Price
      if (!Number.isNaN(minP) && l.price < minP) return false;
      if (!Number.isNaN(maxP) && l.price > maxP) return false;

      // Weight
      const w = Number(l.weight);
      if (!Number.isNaN(w)) {
        if (!Number.isNaN(minW) && w < minW) return false;
        if (!Number.isNaN(maxW) && w > maxW) return false;
      }

      // Age (months)
      if (!Number.isNaN(minA) || !Number.isNaN(maxA)) {
        const months = parseAgeMonths(l.age);
        if (months == null) return false;
        if (!Number.isNaN(minA) && months < minA) return false;
        if (!Number.isNaN(maxA) && months > maxA) return false;
      }

      // Toggles
      if (advancedFilters.featuredOnly && !l.isFeatured) return false;
      if (
        advancedFilters.withImagesOnly &&
        (!l.images || l.images.length === 0)
      ) {
        return false;
      }

      return true;
    });

    // Sort
    switch (advancedFilters.sort) {
      case "price_low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "weight_high":
        result = [...result].sort(
          (a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0)
        );
        break;
      case "weight_low":
        result = [...result].sort(
          (a, b) => (Number(a.weight) || 0) - (Number(b.weight) || 0)
        );
        break;
      case "newest":
      default:
        result = [...result].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [
    listings,
    search,
    activeFilter,
    activeProperties,
    advancedFilters,
  ]);

  // Build "active filter" chip list so the user can see and remove what's applied.
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (advancedFilters.city) {
    activeChips.push({
      key: "loc",
      label: advancedFilters.province
        ? `${advancedFilters.city}, ${advancedFilters.province}`
        : advancedFilters.city,
      clear: () =>
        setAdvancedFilters((p) => ({ ...p, city: "", province: "" })),
    });
  }
  if (advancedFilters.breed) {
    activeChips.push({
      key: "breed",
      label: `Breed: ${advancedFilters.breed}`,
      clear: () => setAdvancedFilters((p) => ({ ...p, breed: "" })),
    });
  }
  if (advancedFilters.minPrice || advancedFilters.maxPrice) {
    activeChips.push({
      key: "price",
      label: `Rs. ${advancedFilters.minPrice || "0"} – ${
        advancedFilters.maxPrice || "∞"
      }`,
      clear: () =>
        setAdvancedFilters((p) => ({ ...p, minPrice: "", maxPrice: "" })),
    });
  }
  if (advancedFilters.minWeight || advancedFilters.maxWeight) {
    activeChips.push({
      key: "weight",
      label: `${advancedFilters.minWeight || "0"}–${
        advancedFilters.maxWeight || "∞"
      } kg`,
      clear: () =>
        setAdvancedFilters((p) => ({ ...p, minWeight: "", maxWeight: "" })),
    });
  }
  if (advancedFilters.minAge || advancedFilters.maxAge) {
    activeChips.push({
      key: "age",
      label: `${advancedFilters.minAge || "0"}–${
        advancedFilters.maxAge || "∞"
      } mo`,
      clear: () =>
        setAdvancedFilters((p) => ({ ...p, minAge: "", maxAge: "" })),
    });
  }
  if (advancedFilters.featuredOnly) {
    activeChips.push({
      key: "featured",
      label: "Featured only",
      clear: () => setAdvancedFilters((p) => ({ ...p, featuredOnly: false })),
    });
  }
  if (advancedFilters.withImagesOnly) {
    activeChips.push({
      key: "withImages",
      label: "With photos",
      clear: () =>
        setAdvancedFilters((p) => ({ ...p, withImagesOnly: false })),
    });
  }

  const hasAdvancedFilters = activeChips.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />
      <View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.navy + "f0",
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>
          Browse Animals
        </Text>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.navyLight, borderColor: colors.border },
            ]}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search by name, city, breed..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[
              styles.filterBtn,
              {
                backgroundColor: hasAdvancedFilters
                  ? colors.teal
                  : colors.navyLight,
                borderColor: hasAdvancedFilters ? colors.teal : colors.border,
              },
            ]}
          >
            <Feather
              name="sliders"
              size={20}
              color={hasAdvancedFilters ? colors.navy : colors.foreground}
            />
            {hasAdvancedFilters && (
              <View style={[styles.filterBadge, { backgroundColor: colors.gold }]}>
                <Text style={styles.filterBadgeText}>{activeChips.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 8, paddingBottom: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.id)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === item.id ? colors.teal : colors.navyMid,
                  borderColor:
                    activeFilter === item.id ? colors.teal : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === item.id
                        ? colors.navy
                        : colors.mutedForeground,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Property chips */}
        <View style={styles.propertyRow}>
          <Text style={[styles.propertyLabel, { color: colors.mutedForeground }]}>
            Property:
          </Text>
          {PROPERTY_CHIPS.map((chip) => {
            const isActive = activeProperties.includes(chip.id);
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => toggleProperty(chip.id)}
                style={[
                  styles.propertyChip,
                  {
                    backgroundColor: isActive ? colors.gold + "22" : colors.navyMid,
                    borderColor: isActive ? colors.gold : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.propertyChipText,
                    { color: isActive ? colors.gold : colors.mutedForeground },
                  ]}
                >
                  {chip.label}
                </Text>
                <Text
                  style={[
                    styles.propertyChipAr,
                    {
                      color: isActive
                        ? colors.gold + "cc"
                        : colors.mutedForeground + "88",
                    },
                  ]}
                >
                  {chip.labelAr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active applied filters (from modal) */}
        {activeChips.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.appliedRow}
          >
            {activeChips.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={c.clear}
                style={[
                  styles.appliedChip,
                  {
                    backgroundColor: colors.teal + "22",
                    borderColor: colors.teal,
                  },
                ]}
              >
                <Text style={[styles.appliedChipText, { color: colors.teal }]}>
                  {c.label}
                </Text>
                <Feather name="x" size={12} color={colors.teal} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setAdvancedFilters(DEFAULT_FILTERS)}
              style={[styles.clearAllBtn, { borderColor: colors.border }]}
            >
              <Text
                style={[styles.clearAllText, { color: colors.mutedForeground }]}
              >
                Clear all
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Sort + count */}
        <View style={styles.sortRow}>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {filtered.length} animal{filtered.length === 1 ? "" : "s"}
          </Text>
          <View style={styles.sortChips}>
            {QUICK_SORT.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSort(opt.id)}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor:
                      advancedFilters.sort === opt.id
                        ? colors.gold + "22"
                        : "transparent",
                    borderColor:
                      advancedFilters.sort === opt.id
                        ? colors.gold + "66"
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    {
                      color:
                        advancedFilters.sort === opt.id
                          ? colors.gold
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: bottomPad + 80,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AnimalCard
            listing={item}
            onPress={() => router.push(`/animal/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No animals found
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Try adjusting your search or filters
            </Text>
            {(hasAdvancedFilters || search || activeFilter !== "all" || activeProperties.length > 0) && (
              <TouchableOpacity
                onPress={() => {
                  setSearch("");
                  setActiveFilter("all");
                  setActiveProperties([]);
                  setAdvancedFilters(DEFAULT_FILTERS);
                }}
                style={[styles.resetCta, { backgroundColor: colors.teal }]}
              >
                <Text style={[styles.resetCtaText, { color: colors.navy }]}>
                  Reset all filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={advancedFilters}
        onApply={(next) => setAdvancedFilters(next)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stickyHeader: {
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    gap: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    color: "#000",
    fontFamily: "Inter_700Bold",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  appliedRow: {
    gap: 8,
    paddingBottom: 10,
    paddingRight: 8,
  },
  appliedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  appliedChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  clearAllText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
  },
  propertyLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  propertyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  propertyChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  propertyChipAr: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  sortChips: {
    flexDirection: "row",
    gap: 6,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  sortText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resetCta: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetCtaText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});
