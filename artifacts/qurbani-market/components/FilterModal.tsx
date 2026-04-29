import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { LocationPickerSheet, type LocationResult } from "@/components/LocationPickerSheet";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    province: string;
    city: string;
    minPrice: string;
    maxPrice: string;
    minWeight: string;
    maxWeight: string;
  };
  onApply: (filters: {
    province: string;
    city: string;
    minPrice: string;
    maxPrice: string;
    minWeight: string;
    maxWeight: string;
  }) => void;
}

export function FilterModal({ visible, onClose, filters, onApply }: FilterModalProps) {
  const colors = useColors();
  const [localFilters, setLocalFilters] = useState(filters);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const reset = { province: "", city: "", minPrice: "", maxPrice: "", minWeight: "", maxWeight: "" };
    setLocalFilters(reset);
    onApply(reset);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}>
        <View style={[styles.content, { backgroundColor: colors.navy }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Advanced Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Location</Text>
            <TouchableOpacity
              onPress={() => setLocationPickerOpen(true)}
              style={[
                styles.locationBtn,
                {
                  backgroundColor: localFilters.city ? colors.teal + "12" : colors.navyMid,
                  borderColor: localFilters.city ? colors.teal : colors.border,
                },
              ]}
            >
              <Feather name="map-pin" size={18} color={localFilters.city ? colors.teal : colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                {localFilters.city ? (
                  <Text style={[styles.locationPrimary, { color: colors.foreground }]}>
                    {localFilters.city}, {localFilters.province}
                  </Text>
                ) : (
                  <Text style={[styles.locationPlaceholder, { color: colors.mutedForeground }]}>
                    All Cities
                  </Text>
                )}
              </View>
              {localFilters.city ? (
                <TouchableOpacity onPress={() => setLocalFilters({ ...localFilters, province: "", city: "" })}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              ) : (
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Price Range (Rs.)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.navyMid, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Min"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.minPrice}
                onChangeText={(t) => setLocalFilters({ ...localFilters, minPrice: t })}
              />
              <Text style={{ color: colors.mutedForeground }}>—</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.navyMid, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Max"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.maxPrice}
                onChangeText={(t) => setLocalFilters({ ...localFilters, maxPrice: t })}
              />
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Weight Range (kg)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.navyMid, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Min"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.minWeight}
                onChangeText={(t) => setLocalFilters({ ...localFilters, minWeight: t })}
              />
              <Text style={{ color: colors.mutedForeground }}>—</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.navyMid, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Max"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={localFilters.maxWeight}
                onChangeText={(t) => setLocalFilters({ ...localFilters, maxWeight: t })}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={[styles.applyBtn, { backgroundColor: colors.teal }]}>
              <Text style={[styles.applyBtnText, { color: colors.navy }]}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <LocationPickerSheet
        visible={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(loc: LocationResult) => {
          setLocalFilters({ ...localFilters, province: loc.province, city: loc.city });
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
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
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
