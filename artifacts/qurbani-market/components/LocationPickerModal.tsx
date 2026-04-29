/**
 * LocationPickerModal — opens from the header pin icon.
 * Two paths:
 *   1) "Use my GPS location"  — uses expo-location + reverse geocode
 *   2) "Select manually"      — Province → District → City drill-down
 */
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { PAKISTAN_LOCATIONS, type District, type Province } from "@/data/pakistan-cities";
import { useLocation, type UserLocation } from "@/contexts/LocationContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Step = "root" | "province" | "district" | "city";

export function LocationPickerModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { setLocation } = useLocation();

  const [step, setStep] = useState<Step>("root");
  const [province, setProvince] = useState<Province | null>(null);
  const [district, setDistrict] = useState<District | null>(null);
  const [search, setSearch] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const reset = () => {
    setStep("root");
    setProvince(null);
    setDistrict(null);
    setSearch("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const useGps = async () => {
    setGpsLoading(true);
    try {
      if (Platform.OS === "web") {
        Alert.alert("GPS unavailable", "Please pick a city manually on web preview.");
        setGpsLoading(false);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Enable location to auto-detect your city.");
        setGpsLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let city = "Unknown";
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (places.length > 0) {
          city = places[0].city || places[0].subregion || places[0].region || city;
        }
      } catch {}
      const loc: UserLocation = {
        city,
        source: "gps",
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      await setLocation(loc);
      close();
    } catch (e) {
      Alert.alert("Couldn't get location", "Try again or pick a city manually.");
    } finally {
      setGpsLoading(false);
    }
  };

  const pickCity = async (city: string, opts?: { district?: string; province?: string }) => {
    await setLocation({
      city,
      district: opts?.district ?? district?.name,
      province: opts?.province ?? province?.name,
      source: "manual",
    });
    close();
  };

  // Search across all cities (when on root step)
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const out: { city: string; district: string; province: string }[] = [];
    for (const p of PAKISTAN_LOCATIONS) {
      for (const d of p.districts) {
        for (const c of d.cities) {
          if (c.toLowerCase().includes(q)) {
            out.push({ city: c, district: d.name, province: p.name });
            if (out.length >= 50) return out;
          }
        }
      }
    }
    return out;
  }, [search]);

  const renderHeader = (title: string, onBack?: () => void) => (
    <View style={styles.modalHeader}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}
      <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
      <TouchableOpacity onPress={close} style={styles.closeBtn}>
        <Feather name="x" size={20} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={[styles.overlay, { backgroundColor: "#0009" }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.navy, borderColor: colors.border },
          ]}
        >
          {step === "root" && (
            <>
              {renderHeader("Set your location")}
              <TouchableOpacity
                onPress={useGps}
                disabled={gpsLoading}
                style={[
                  styles.gpsBtn,
                  { backgroundColor: colors.teal + "22", borderColor: colors.teal },
                ]}
              >
                {gpsLoading ? (
                  <ActivityIndicator color={colors.teal} />
                ) : (
                  <Feather name="navigation" size={18} color={colors.teal} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gpsTitle, { color: colors.teal }]}>
                    Use my GPS location
                  </Text>
                  <Text style={[styles.gpsSub, { color: colors.mutedForeground }]}>
                    Auto-detect your nearest city
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.teal} />
              </TouchableOpacity>

              <Text style={[styles.divider, { color: colors.mutedForeground }]}>
                — or pick manually —
              </Text>

              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: colors.navyLight, borderColor: colors.border },
                ]}
              >
                <Feather name="search" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search any city in Pakistan..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
              </View>

              {search.trim() ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, i) => `${item.city}-${i}`}
                  ItemSeparatorComponent={() => (
                    <View style={[styles.sep, { backgroundColor: colors.border }]} />
                  )}
                  ListEmptyComponent={
                    <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                      No cities match "{search}"
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() =>
                        pickCity(item.city, { district: item.district, province: item.province })
                      }
                      style={styles.row}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                          {item.city}
                        </Text>
                        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                          {item.district}, {item.province}
                        </Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <FlatList
                  data={PAKISTAN_LOCATIONS}
                  keyExtractor={(p) => p.name}
                  ItemSeparatorComponent={() => (
                    <View style={[styles.sep, { backgroundColor: colors.border }]} />
                  )}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        setProvince(item);
                        setStep("district");
                      }}
                      style={styles.row}
                    >
                      <Feather name="map" size={16} color={colors.gold} />
                      <Text style={[styles.rowTitle, { color: colors.foreground, flex: 1, marginLeft: 10 }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                        {item.districts.length} districts
                      </Text>
                      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </>
          )}

          {step === "district" && province && (
            <>
              {renderHeader(province.name, () => setStep("root"))}
              <FlatList
                data={province.districts}
                keyExtractor={(d) => d.name}
                ItemSeparatorComponent={() => (
                  <View style={[styles.sep, { backgroundColor: colors.border }]} />
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setDistrict(item);
                      setStep("city");
                    }}
                    style={styles.row}
                  >
                    <Feather name="map-pin" size={15} color={colors.teal} />
                    <Text style={[styles.rowTitle, { color: colors.foreground, flex: 1, marginLeft: 10 }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                      {item.cities.length} cities
                    </Text>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {step === "city" && district && (
            <>
              {renderHeader(district.name, () => setStep("district"))}
              <FlatList
                data={district.cities}
                keyExtractor={(c, i) => `${c}-${i}`}
                ItemSeparatorComponent={() => (
                  <View style={[styles.sep, { backgroundColor: colors.border }]} />
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => pickCity(item)} style={styles.row}>
                    <Feather name="home" size={15} color={colors.gold} />
                    <Text style={[styles.rowTitle, { color: colors.foreground, flex: 1, marginLeft: 10 }]}>
                      {item}
                    </Text>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              />
            </>
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
    height: "85%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  gpsTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  gpsSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  divider: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginVertical: 6,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 4,
    gap: 6,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginRight: 6,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
  },
  empty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 28,
  },
});
