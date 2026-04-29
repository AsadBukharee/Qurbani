import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimalCard } from "@/components/AnimalCard";
import { FilterModal } from "@/components/FilterModal";
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

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "price_low", label: "Price: Low" },
  { id: "price_high", label: "Price: High" },
];

export default function ListingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { listings } = useApp();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeProperties, setActiveProperties] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    province: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    minWeight: "",
    maxWeight: "",
  });
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const toggleProperty = (id: string) => {
    setActiveProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  let filtered = listings.filter((l) => {
    const matchSearch =
      !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      l.breed.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeFilter === "all" || l.category === activeFilter;
    const matchProp =
      activeProperties.length === 0 ||
      (l.animalProperty != null && activeProperties.includes(l.animalProperty));

    let matchAdv = true;
    if (advancedFilters.city && l.city !== advancedFilters.city) matchAdv = false;
    
    // Check price
    const minP = parseInt(advancedFilters.minPrice);
    if (!isNaN(minP) && l.price < minP) matchAdv = false;
    const maxP = parseInt(advancedFilters.maxPrice);
    if (!isNaN(maxP) && l.price > maxP) matchAdv = false;

    // Check weight
    const w = Number(l.weight);
    if (!isNaN(w)) {
      const minW = parseInt(advancedFilters.minWeight);
      if (!isNaN(minW) && w < minW) matchAdv = false;
      const maxW = parseInt(advancedFilters.maxWeight);
      if (!isNaN(maxW) && w > maxW) matchAdv = false;
    }

    return matchSearch && matchCat && matchProp && matchAdv;
  });

  const hasAdvancedFilters = () =>
    Boolean(
      advancedFilters.province ||
        advancedFilters.city ||
        advancedFilters.minPrice ||
        advancedFilters.maxPrice ||
        advancedFilters.minWeight ||
        advancedFilters.maxWeight
    );

  if (sortBy === "price_low") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_high") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  } else if (sortBy === "weight_high") {
    filtered = [...filtered].sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
  }

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
                backgroundColor: hasAdvancedFilters() ? colors.teal : colors.navyLight,
                borderColor: hasAdvancedFilters() ? colors.teal : colors.border,
              },
            ]}
          >
            <Feather name="sliders" size={20} color={hasAdvancedFilters() ? colors.navy : colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
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
                    activeFilter === item.id
                      ? colors.teal
                      : colors.navyMid,
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

        {/* Property Chips */}
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
                <Text style={[styles.propertyChipText, { color: isActive ? colors.gold : colors.mutedForeground }]}>
                  {chip.label}
                </Text>
                <Text style={[styles.propertyChipAr, { color: isActive ? colors.gold + "cc" : colors.mutedForeground + "88" }]}>
                  {chip.labelAr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sort */}
        <View style={styles.sortRow}>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {filtered.length} animals
          </Text>
          <View style={styles.sortChips}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setSortBy(opt.id)}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor:
                      sortBy === opt.id ? colors.gold + "22" : "transparent",
                    borderColor:
                      sortBy === opt.id ? colors.gold + "66" : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    {
                      color:
                        sortBy === opt.id ? colors.gold : colors.mutedForeground,
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
          </View>
        }
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
});
