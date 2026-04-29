/**
 * LocationPickerSheet — cascading Province → City → Street address picker.
 *
 * Renders as a full-screen modal with 3 steps.
 */
import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PROVINCES, type ProvinceData } from "@/data/pakistan_locations";
import { useColors } from "@/hooks/useColors";

export interface LocationResult {
  province: string;
  city: string;
  street: string;
}

interface LocationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (loc: LocationResult) => void;
  /** Pre-fill values */
  initial?: Partial<LocationResult>;
  /** If true, skip the street step */
  skipStreet?: boolean;
}

type Step = "province" | "city" | "street";

export function LocationPickerSheet({
  visible,
  onClose,
  onSelect,
  initial,
  skipStreet = false,
}: LocationPickerSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("province");
  const [province, setProvince] = useState(initial?.province ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [searchText, setSearchText] = useState("");

  const selectedProvince = PROVINCES.find((p) => p.name === province);

  const filteredProvinces = useMemo(() => {
    if (!searchText) return PROVINCES;
    const q = searchText.toLowerCase();
    return PROVINCES.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameUr.includes(searchText)
    );
  }, [searchText]);

  const filteredCities = useMemo(() => {
    if (!selectedProvince) return [];
    if (!searchText) return selectedProvince.cities;
    const q = searchText.toLowerCase();
    return selectedProvince.cities.filter((c) => c.toLowerCase().includes(q));
  }, [selectedProvince, searchText]);

  const handleProvinceSelect = (p: ProvinceData) => {
    setProvince(p.name);
    setCity("");
    setSearchText("");
    setStep("city");
  };

  const handleCitySelect = (c: string) => {
    setCity(c);
    setSearchText("");
    if (skipStreet) {
      onSelect({ province, city: c, street: "" });
      resetAndClose();
    } else {
      setStep("street");
    }
  };

  const handleStreetConfirm = () => {
    onSelect({ province, city, street });
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep("province");
    setSearchText("");
    onClose();
  };

  const goBack = () => {
    setSearchText("");
    if (step === "city") setStep("province");
    else if (step === "street") setStep("city");
    else resetAndClose();
  };

  const title =
    step === "province"
      ? "Select Province"
      : step === "city"
      ? `Select City — ${province}`
      : "Street Address";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.navy,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {title}
              </Text>
            </View>
            <TouchableOpacity onPress={resetAndClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {step !== "street" && (
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: colors.navyLight,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder={
                  step === "province" ? "Search province..." : "Search city..."
                }
                placeholderTextColor={colors.mutedForeground}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
              {searchText ? (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Feather
                    name="x-circle"
                    size={16}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Province list */}
          {step === "province" && (
            <FlatList
              data={filteredProvinces}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleProvinceSelect(item)}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor:
                        province === item.name
                          ? colors.teal + "15"
                          : colors.navyLight,
                      borderColor:
                        province === item.name ? colors.teal : colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.itemLabel,
                        {
                          color:
                            province === item.name
                              ? colors.teal
                              : colors.foreground,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.itemSub,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.nameUr} • {item.cities.length} cities
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
            />
          )}

          {/* City list */}
          {step === "city" && (
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCitySelect(item)}
                  style={[
                    styles.listItem,
                    {
                      backgroundColor:
                        city === item
                          ? colors.teal + "15"
                          : colors.navyLight,
                      borderColor:
                        city === item ? colors.teal : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemLabel,
                      {
                        color:
                          city === item ? colors.teal : colors.foreground,
                      },
                    ]}
                  >
                    {item}
                  </Text>
                  {city === item && (
                    <Feather name="check" size={18} color={colors.teal} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  No cities match "{searchText}"
                </Text>
              }
            />
          )}

          {/* Street address input */}
          {step === "street" && (
            <View style={styles.streetSection}>
              <Text
                style={[styles.streetLabel, { color: colors.mutedForeground }]}
              >
                Enter your street address (optional)
              </Text>
              <TextInput
                style={[
                  styles.streetInput,
                  {
                    backgroundColor: colors.navyLight,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="e.g. House 4, Street 12, Johar Town"
                placeholderTextColor={colors.mutedForeground}
                value={street}
                onChangeText={setStreet}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
              <View style={styles.selectedSummary}>
                <Feather name="map-pin" size={14} color={colors.teal} />
                <Text style={[styles.summaryText, { color: colors.foreground }]}>
                  {city}, {province}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleStreetConfirm}
                style={[styles.confirmBtn, { backgroundColor: colors.teal }]}
              >
                <Feather name="check" size={18} color={colors.navy} />
                <Text
                  style={[styles.confirmBtnText, { color: colors.navy }]}
                >
                  Confirm Location
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 6,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  itemLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  itemSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  streetSection: {
    paddingHorizontal: 20,
    gap: 12,
    paddingTop: 8,
  },
  streetLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  streetInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
  },
  selectedSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  summaryText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
