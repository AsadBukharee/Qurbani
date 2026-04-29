import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { LocationPickerSheet, type LocationResult } from "@/components/LocationPickerSheet";
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export type SortKey =
  | "newest"
  | "price_low"
  | "price_high"
  | "weight_high"
  | "weight_low";

export interface AdvancedFilters {
  province: string;
  city: string;
  minPrice: string;
  maxPrice: string;
  minWeight: string;
  maxWeight: string;
  breed: string;
  minAge: string;
  maxAge: string;
  featuredOnly: boolean;
  withImagesOnly: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: AdvancedFilters = {
  province: "",
  city: "",
  minPrice: "",
  maxPrice: "",
  minWeight: "",
  maxWeight: "",
  breed: "",
  minAge: "",
  maxAge: "",
  featuredOnly: false,
  withImagesOnly: false,
  sort: "newest",
};

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "price_low", label: "Price ↑" },
  { id: "price_high", label: "Price ↓" },
  { id: "weight_low", label: "Weight ↑" },
  { id: "weight_high", label: "Weight ↓" },
];

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
}

export function FilterModal({ visible, onClose, filters, onApply }: FilterModalProps) {
  const colors = useColors();
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  // Re-sync local state whenever the modal opens with fresh parent state
  useEffect(() => {
    if (visible) setLocalFilters(filters);
  }, [visible, filters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
    onClose();
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.navyMid,
      borderColor: colors.border,
      color: colors.foreground,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <View style={[styles.content, { backgroundColor: colors.navy }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Advanced Filters
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            {/* Sort */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Sort by
            </Text>
            <View style={styles.sortRow}>
              {SORT_OPTIONS.map((opt) => {
                const active = localFilters.sort === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() =>
                      setLocalFilters({ ...localFilters, sort: opt.id })
                    }
                    style={[
                      styles.sortChip,
                      {
                        backgroundColor: active ? colors.teal : colors.navyMid,
                        borderColor: active ? colors.teal : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortChipText,
                        { color: active ? colors.navy : colors.mutedForeground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Location */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Location
            </Text>
            <TouchableOpacity
              onPress={() => setLocationPickerOpen(true)}
              style={[
                styles.locationBtn,
                {
                  backgroundColor: localFilters.city
                    ? colors.teal + "12"
                    : colors.navyMid,
                  borderColor: localFilters.city ? colors.teal : colors.border,
                },
              ]}
            >
              <Feather
                name="map-pin"
                size={18}
                color={localFilters.city ? colors.teal : colors.mutedForeground}
              />
              <View style={{ flex: 1 }}>
                {localFilters.city ? (
                  <Text style={[styles.locationPrimary, { color: colors.foreground }]}>
                    {localFilters.city}
                    {localFilters.province ? `, ${localFilters.province}` : ""}
                  </Text>
                ) : (
                  <Text
                    style={[styles.locationPlaceholder, { color: colors.mutedForeground }]}
                  >
                    All Cities
                  </Text>
                )}
              </View>
              {localFilters.city ? (
                <TouchableOpacity
                  onPress={() =>
                    setLocalFilters({ ...localFilters, province: "", city: "" })
                  }
                >
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ) : (
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            {/* Breed */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Breed</Text>
            <TextInput
              style={inputStyle}
              placeholder="e.g. Beetal, Sahiwal"
              placeholderTextColor={colors.mutedForeground}
              value={localFilters.breed}
              onChangeText={(t) => setLocalFilters({ ...localFilters, breed: t })}
            />

            {/* Price */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Price Range (Rs.)
            </Text>
            <View style={styles.row}>
              <TextInput
                style={inputStyle}
                placeholder="Min"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.minPrice}
                onChangeText={(t) =>
                  setLocalFilters({ ...localFilters, minPrice: t })
                }
              />
              <Text style={{ color: colors.mutedForeground }}>—</Text>
              <TextInput
                style={inputStyle}
                placeholder="Max"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.maxPrice}
                onChangeText={(t) =>
                  setLocalFilters({ ...localFilters, maxPrice: t })
                }
              />
            </View>

            {/* Weight */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Weight Range (kg)
            </Text>
            <View style={styles.row}>
              <TextInput
                style={inputStyle}
                placeholder="Min"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.minWeight}
                onChangeText={(t) =>
                  setLocalFilters({ ...localFilters, minWeight: t })
                }
              />
              <Text style={{ color: colors.mutedForeground }}>—</Text>
              <TextInput
                style={inputStyle}
                placeholder="Max"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.maxWeight}
                onChangeText={(t) =>
                  setLocalFilters({ ...localFilters, maxWeight: t })
                }
              />
            </View>

            {/* Age */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Age Range (months)
            </Text>
            <View style={styles.row}>
              <TextInput
                style={inputStyle}
                placeholder="Min"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.minAge}
                onChangeText={(t) =>
                  setLocalFilters({ ...localFilters, minAge: t })
                }
              />
              <Text style={{ color: colors.mutedForeground }}>—</Text>
              <TextInput
                style={inputStyle}
                placeholder="Max"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.maxAge}
                onChangeText={(t) =>
                  setLocalFilters({ ...localFilters, maxAge: t })
                }
              />
            </View>

            {/* Toggles */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                  Featured listings only
                </Text>
                <Text style={[styles.toggleHint, { color: colors.mutedForeground }]}>
                  Highlighted by sellers
                </Text>
              </View>
              <Switch
                value={localFilters.featuredOnly}
                onValueChange={(v) =>
                  setLocalFilters({ ...localFilters, featuredOnly: v })
                }
                trackColor={{ false: colors.navyMid, true: colors.teal }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                  With photos only
                </Text>
                <Text style={[styles.toggleHint, { color: colors.mutedForeground }]}>
                  Hide listings without images
                </Text>
              </View>
              <Switch
                value={localFilters.withImagesOnly}
                onValueChange={(v) =>
                  setLocalFilters({ ...localFilters, withImagesOnly: v })
                }
                trackColor={{ false: colors.navyMid, true: colors.teal }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>
                Reset All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              style={[styles.applyBtn, { backgroundColor: colors.teal }]}
            >
              <Text style={[styles.applyBtnText, { color: colors.navy }]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <LocationPickerSheet
        visible={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(loc: LocationResult) => {
          setLocalFilters({
            ...localFilters,
            province: loc.province,
            city: loc.city,
          });
        }}
        initial={{ province: localFilters.province, city: localFilters.city }}
        skipStreet
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  form: {
    gap: 14,
    paddingBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  toggleHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  resetBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  resetBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  applyBtn: {
    flex: 2,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  applyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  locationPrimary: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  locationPlaceholder: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
