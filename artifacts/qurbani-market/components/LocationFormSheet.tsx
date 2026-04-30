/**
 * LocationFormSheet — full-screen modal that mirrors Step 2 of the
 * "Create Ad" wizard. Used both from the home header "Set location" pill
 * and (optionally) anywhere else we need a unified location editor.
 *
 * Persists the selection to LocationContext (which writes to AsyncStorage).
 */
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation, type UserLocation } from "@/contexts/LocationContext";
import { useColors } from "@/hooks/useColors";
import { MapPreview } from "@/components/MapPreview";

export interface LocationFormValue {
  province: string;
  city: string;
  address: string;
  lat: number | null;
  lon: number | null;
}

interface LocationFormSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Optional callback after the user saves; receives the chosen value. */
  onSaved?: (value: LocationFormValue) => void;
}

export function LocationFormSheet({
  visible,
  onClose,
  onSaved,
}: LocationFormSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { location, setLocation } = useLocation();
  const [form, setForm] = useState<LocationFormValue>({
    province: "",
    city: "",
    address: "",
    lat: null,
    lon: null,
  });
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-fill from saved location every time we open
  useEffect(() => {
    if (visible) {
      setForm({
        province: location?.province ?? "",
        city: location?.city ?? "",
        address: location?.address ?? "",
        lat: location?.lat ?? null,
        lon: location?.lng ?? null,
      });
    }
  }, [visible, location]);

  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const handleGetLocation = async () => {
    setFetching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location services to use this feature."
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setForm({
        province: geocode?.region || "",
        city: geocode?.city || geocode?.subregion || "",
        address: geocode?.street || geocode?.name || "",
        lat: loc.coords.latitude,
        lon: loc.coords.longitude,
      });
    } catch {
      Alert.alert("Error", "Could not fetch location.");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!form.city || !form.province) {
      Alert.alert(
        "Location Required",
        "Please provide at least your province and city."
      );
      return;
    }
    setSaving(true);
    try {
      const payload: UserLocation = {
        province: form.province,
        city: form.city,
        address: form.address,
        lat: form.lat ?? undefined,
        lng: form.lon ?? undefined,
        source: form.lat != null ? "gps" : "manual",
      };
      await setLocation(payload);
      onSaved?.(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={[styles.root, { backgroundColor: colors.navy }]}>
        <View
          style={[
            styles.header,
            { paddingTop: topPad + 8, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Set Location
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 100 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
            This helps buyers find local listings near you and pre-fills your
            ads.
          </Text>

          <TouchableOpacity
            style={[
              styles.mapPlaceholder,
              {
                backgroundColor: colors.navyLight,
                borderColor: colors.teal + "44",
              },
            ]}
            onPress={handleGetLocation}
            disabled={fetching}
          >
            {fetching ? (
              <ActivityIndicator color={colors.teal} size="small" />
            ) : (
              <Feather name="map-pin" size={24} color={colors.teal} />
            )}
            <Text style={[styles.mapText, { color: colors.foreground }]}>
              {fetching ? "Getting location..." : "Use Current Location"}
            </Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Province
            </Text>
            <TextInput
              value={form.province}
              onChangeText={(t) => setForm({ ...form, province: t })}
              placeholder="e.g. Punjab"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.navyLight,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              City
            </Text>
            <TextInput
              value={form.city}
              onChangeText={(t) => setForm({ ...form, city: t })}
              placeholder="e.g. Lahore"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.navyLight,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Full Address
            </Text>
            <TextInput
              value={form.address}
              onChangeText={(t) => setForm({ ...form, address: t })}
              placeholder="Street, area, etc."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.navyLight,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Map Preview
            </Text>
            <MapPreview
              lat={form.lat}
              lon={form.lon}
              height={170}
              bg={colors.navyLight}
              pinColor={colors.gold}
            />
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: bottomPad + 12,
              backgroundColor: colors.navy,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveBtn,
              { backgroundColor: colors.teal, opacity: saving ? 0.6 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.navy} size="small" />
            ) : (
              <>
                <Feather name="check" size={18} color={colors.navy} />
                <Text style={[styles.saveBtnText, { color: colors.navy }]}>
                  Save Location
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  stepSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    lineHeight: 18,
  },
  mapPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 20,
  },
  mapText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  inputGroup: {
    marginBottom: 16,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
