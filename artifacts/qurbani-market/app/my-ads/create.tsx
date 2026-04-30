import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarryBackground } from "@/components/StarryBackground";
import { StepperProgress } from "@/components/StepperProgress";
import { ConfettiOverlay } from "@/components/ConfettiOverlay";
import { MediaUploader, type MediaItem } from "@/components/MediaUploader";
import { MapPreview } from "@/components/MapPreview";
import { useApp } from "@/contexts/AppContext";
import { useLocation } from "@/contexts/LocationContext";
import { useColors } from "@/hooks/useColors";
import { animals as animalsApi } from "@/lib/api";

export default function CreateAdScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, addListing, platformConfig } = useApp();
  const { location: savedLocation, setLocation: persistLocation } = useLocation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form State - Step 1 (Media — images + videos, max 5, see MediaUploader)
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const uploadingMedia = media.some((m) => m.status === "uploading");
  const doneMedia = media.filter((m) => m.status === "done");

  // Form State - Step 2 (Location) — pre-filled from saved location (AsyncStorage)
  const [location, setLocation] = useState({
    province: savedLocation?.province ?? "",
    district: savedLocation?.district ?? "",
    city: savedLocation?.city ?? "",
    address: savedLocation?.address ?? "",
    lat: (savedLocation?.lat ?? null) as number | null,
    lon: (savedLocation?.lng ?? null) as number | null,
  });

  // If the saved location loads from AsyncStorage AFTER mount (async), backfill
  // the form once — but never overwrite values the user has already changed.
  useEffect(() => {
    if (!savedLocation) return;
    setLocation((prev) => ({
      province: prev.province || (savedLocation.province ?? ""),
      district: prev.district || (savedLocation.district ?? ""),
      city: prev.city || savedLocation.city,
      address: prev.address || (savedLocation.address ?? ""),
      lat: prev.lat ?? (savedLocation.lat ?? null),
      lon: prev.lon ?? (savedLocation.lng ?? null),
    }));
  }, [savedLocation]);

  // Form State - Step 3 (Details)
  const [details, setDetails] = useState({
    category: "goat" as any,
    title: "",
    price: "",
    weight: "",
    breed: "",
    age: "",
    description: "",
    animalProperty: "khasi" as "khasi" | "andal",
  });

  // Form State - Step 4 (Publish)
  const [publishMode, setPublishMode] = useState<"published" | "draft" | "scheduled">("published");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);

  const [fetchingLocation, setFetchingLocation] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const steps = ["Media", "Location", "Details", "Publish"];

  const handleNext = () => {
    if (step === 1) {
      if (doneMedia.length === 0) {
        Alert.alert(
          "Media Required",
          "Please upload at least one photo or video of your animal."
        );
        return;
      }
      if (uploadingMedia) {
        Alert.alert(
          "Uploads in Progress",
          "Please wait for all media to finish uploading before continuing."
        );
        return;
      }
    }
    if (step === 2 && (!location.city || !location.province)) {
      Alert.alert("Location Required", "Please provide at least your province and city.");
      return;
    }
    if (step === 3) {
      if (!details.title || !details.price || !details.weight) {
        Alert.alert("Missing Info", "Please fill in title, price, and weight.");
        return;
      }
    }
    if (step === 4) {
      handleFinalSubmit();
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Extract keywords from description
      const keywords = details.description
        .match(/#(\w+)/g)
        ?.map((k) => k.replace("#", "").toLowerCase()) || [];

      const uploadedUrls = doneMedia.map((m) => m.uri);
      // Cover index is into the user-facing list (which only shows done items).
      const safeCoverIndex = Math.max(
        0,
        Math.min(coverIndex, uploadedUrls.length - 1)
      );

      const payload = {
        title: details.title,
        category: details.category,
        animalProperty: details.animalProperty,
        price: parseInt(details.price, 10),
        weight: parseInt(details.weight, 10),
        age: details.age || "Unknown",
        breed: details.breed || "Local",
        city: location.city,
        province: location.province,
        district: (location as any).district || "",
        streetAddress: location.address,
        latitude: location.lat,
        longitude: location.lon,
        description: details.description,
        images: uploadedUrls,
        coverImageIndex: safeCoverIndex,
        keywords,
        status: publishMode,
        scheduledAt: scheduledDate?.toISOString() || null,
        phone: user?.phone || "",
      };

      console.log("[create-ad] submitting payload", payload);
      const res = await addListing(payload);

      if (!res.ok) {
        console.warn("[create-ad] submission failed:", res.error);
        Alert.alert("Submission Failed", res.error);
        return;
      }

      if (publishMode === "published") {
        setShowConfetti(true);
        setTimeout(() => {
          router.replace("/my-ads");
        }, 3000);
      } else {
        Alert.alert("Success", publishMode === "draft" ? "Ad saved as draft." : "Ad scheduled.", [
          { text: "OK", onPress: () => router.replace("/my-ads") }
        ]);
      }
    } catch (err) {
      console.error("[create-ad] unexpected error", err);
      Alert.alert("Error", (err as any)?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const handleGetLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location services to use this feature.");
        setFetchingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      let city = "";
      let province = "";
      let address = "";

      // Native: use expo-location's reverse geocoder.
      // Web: reverseGeocodeAsync is unsupported, so fall back to OpenStreetMap Nominatim.
      if (Platform.OS === "web") {
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
            { headers: { Accept: "application/json" } }
          );
          if (resp.ok) {
            const data = await resp.json();
            const a = data.address || {};
            city = a.city || a.town || a.village || a.suburb || a.county || "";
            province = a.state || a.region || "";
            address =
              data.display_name ||
              [a.road, a.neighbourhood, a.suburb].filter(Boolean).join(", ");
          }
        } catch {
          // network error — leave fields blank, user can type manually
        }
      } else {
        const [geocode] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        city = geocode?.city || geocode?.subregion || "";
        province = geocode?.region || "";
        address = geocode?.street || geocode?.name || "";
      }

      const next = {
        ...location,
        lat,
        lon,
        city,
        province,
        address,
      };
      setLocation(next);
      // Also persist to user-wide saved location so the home pill + future ads
      // pick this up automatically.
      try {
        await persistLocation({
          city: next.city,
          province: next.province,
          address: next.address,
          lat: next.lat ?? undefined,
          lng: next.lon ?? undefined,
          source: "gps",
        });
      } catch {
        // non-fatal — form state is the source of truth for this submission
      }
    } catch (error) {
      Alert.alert("Error", "Could not fetch location.");
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleUpload = async (file: { uri: string; name: string; type: string }) => {
    const res = await animalsApi.upload(file);
    return { url: res.url, publicId: res.public_id };
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name={step === 1 ? "x" : "arrow-left"} size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.stepperContainer}>
          <StepperProgress steps={steps} currentStep={step} onStepPress={(s) => setStep(s)} />
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Upload Media</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Add up to 5 photos or videos of your animal. Tap the three dots
              on a tile to mark it as the cover or remove it.
            </Text>

            <MediaUploader
              value={media}
              onChange={setMedia}
              coverIndex={coverIndex}
              onCoverChange={setCoverIndex}
              uploadFn={handleUpload}
              max={5}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Location Details</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Where is the animal located? This helps buyers find local listings.
            </Text>

            <TouchableOpacity 
              style={[styles.mapPlaceholder, { backgroundColor: colors.navyLight, borderColor: colors.teal + "44" }]}
              onPress={handleGetLocation}
              disabled={fetchingLocation}
            >
              {fetchingLocation ? (
                <ActivityIndicator color={colors.teal} size="small" />
              ) : (
                <Feather name="map-pin" size={24} color={colors.teal} />
              )}
              <Text style={[styles.mapText, { color: colors.foreground }]}>
                {fetchingLocation ? "Getting location..." : "Use Current Location"}
              </Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Province</Text>
              <TextInput 
                value={location.province}
                onChangeText={(t) => setLocation({...location, province: t})}
                placeholder="e.g. Punjab"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>City</Text>
              <TextInput 
                value={location.city}
                onChangeText={(t) => setLocation({...location, city: t})}
                placeholder="e.g. Lahore"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Full Address</Text>
              <TextInput 
                value={location.address}
                onChangeText={(t) => setLocation({...location, address: t})}
                placeholder="Street, area, etc."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Map Preview</Text>
              <MapPreview
                lat={location.lat}
                lon={location.lon}
                height={170}
                bg={colors.navyLight}
                pinColor={colors.gold}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Animal Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Ad Title</Text>
              <TextInput 
                value={details.title}
                onChangeText={(t) => setDetails({...details, title: t})}
                placeholder="e.g. Beautiful White Bakra"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Price (PKR)</Text>
                <TextInput 
                  value={details.price}
                  onChangeText={(t) => setDetails({...details, price: t})}
                  placeholder="35000"
                  keyboardType="numeric"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Weight (kg)</Text>
                <TextInput 
                  value={details.weight}
                  onChangeText={(t) => setDetails({...details, weight: t})}
                  placeholder="40"
                  keyboardType="numeric"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Description</Text>
              <TextInput 
                value={details.description}
                onChangeText={(t) => setDetails({...details, description: t})}
                placeholder="Describe your animal... use #hashtags"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={5}
                style={[styles.input, styles.textArea, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
              />
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Publishing Options</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Choose how you want to publish your ad. 
              {platformConfig && (
                <Text style={{ color: colors.gold }}>
                   {"\n"}Note: Ad price is Rs. {platformConfig.ad_price} after {platformConfig.free_ad_limit} free ads.
                </Text>
              )}
            </Text>

            <View style={styles.publishOptions}>
              {[
                { id: "published", label: "Publish Now", icon: "send", desc: "Visible to buyers immediately" },
                { id: "draft", label: "Save as Draft", icon: "file-text", desc: "Save for later editing" },
                { id: "scheduled", label: "Schedule", icon: "clock", desc: "Auto-publish at a specific time" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setPublishMode(opt.id as any)}
                  style={[
                    styles.publishOption,
                    { 
                      backgroundColor: publishMode === opt.id ? colors.teal + "18" : colors.navyLight,
                      borderColor: publishMode === opt.id ? colors.teal : colors.border
                    }
                  ]}
                >
                  <View style={[styles.optIcon, { backgroundColor: publishMode === opt.id ? colors.teal : colors.navyMid }]}>
                    <Feather name={opt.icon as any} size={18} color={publishMode === opt.id ? colors.navy : colors.mutedForeground} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                    <Text style={[styles.optDesc, { color: colors.mutedForeground }]}>{opt.desc}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: publishMode === opt.id ? colors.teal : colors.border }]}>
                    {publishMode === opt.id && <View style={[styles.radioInner, { backgroundColor: colors.teal }]} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {publishMode === "scheduled" && (
              <View style={styles.inputGroup}>
                 <Text style={[styles.label, { color: colors.mutedForeground }]}>Scheduled Date & Time</Text>
                 <TouchableOpacity 
                   style={[styles.input, { backgroundColor: colors.navyLight, borderColor: colors.border, justifyContent: "center" }]}
                   onPress={() => Alert.alert("Time Picker", "Date/Time picker would open here.")}
                 >
                   <Text style={{ color: colors.foreground }}>
                     {scheduledDate ? scheduledDate.toLocaleString() : "Select Date & Time"}
                   </Text>
                 </TouchableOpacity>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(bottomPad, 20), borderTopColor: colors.border }]}>
        <TouchableOpacity 
          onPress={handleNext}
          disabled={loading}
          style={[styles.nextBtn, { backgroundColor: colors.teal, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <>
              <Text style={[styles.nextBtnText, { color: colors.navy }]}>
                {step === 4 ? (publishMode === "draft" ? "Save Draft" : "Confirm & Publish") : "Continue"}
              </Text>
              <Feather name={step === 4 ? "check" : "arrow-right"} size={18} color={colors.navy} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <ConfettiOverlay visible={showConfetti} />
    </View>
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
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepperContainer: { flex: 1, paddingHorizontal: 12 },
  content: { padding: 20 },
  stepContainer: { gap: 16 },
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inputGroup: { gap: 6, marginBottom: 12 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  mapPlaceholder: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", marginBottom: 16 },
  mapText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  publishOptions: { gap: 12, marginTop: 12 },
  publishOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  optIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  optLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  optDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    backgroundColor: "transparent",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
});
