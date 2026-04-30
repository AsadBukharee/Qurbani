import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { LocationPickerSheet, type LocationResult } from "@/components/LocationPickerSheet";
import { StarryBackground } from "@/components/StarryBackground";
import { useBoli } from "@/contexts/BoliContext";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = [
  { id: "goat", label: "Bakra (Goat)", imageKey: "goat_featured" },
  { id: "cow", label: "Gaye (Cow)", imageKey: "cow_featured" },
  { id: "sheep", label: "Dumba (Sheep)", imageKey: "sheep_featured" },
  { id: "camel", label: "Oont (Camel)", imageKey: "goat_featured" },
] as const;

const DURATIONS: Array<{ value: 1 | 3 | 5 | 7; label: string; hint: string }> = [
  { value: 1, label: "1 Day", hint: "Fast sell" },
  { value: 3, label: "3 Days", hint: "Popular" },
  { value: 5, label: "5 Days", hint: "Recommended" },
  { value: 7, label: "7 Days", hint: "Max reach" },
];

// CITIES removed — now using LocationPickerSheet
const LISTING_FEE = 1000;

type Step = "details" | "payment" | "confirm";

export default function CreateBoliScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createBoli } = useBoli();
  const { user } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState<Step>("details");
  const [category, setCategory] = useState<"goat" | "cow" | "sheep" | "camel">("goat");
  const [title, setTitle] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [duration, setDuration] = useState<1 | 3 | 5 | 7>(3);
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [breed, setBreed] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "easypaisa" | "jazzcash">("easypaisa");
  const [isProcessing, setIsProcessing] = useState(false);

  const goToPayment = () => {
    if (!title || !startingPrice || !weight || !age || !breed || !city) {
      Alert.alert("Required Fields", "Please fill in all required fields.");
      return;
    }
    const sp = parseInt(startingPrice.replace(/,/g, ""), 10);
    if (isNaN(sp) || sp < 1000) {
      Alert.alert("Invalid Price", "Starting price must be at least Rs. 1,000.");
      return;
    }
    setStep("payment");
  };

  const processPayment = () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to create a Boli listing.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => router.push("/auth/login") },
      ]);
      return;
    }
    setIsProcessing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setStep("confirm");
    }, 1800);
  };

  const publishListing = async () => {
    if (!user) return;
    const catObj = CATEGORIES.find((c) => c.id === category)!;
    const sp = parseInt(startingPrice.replace(/,/g, ""), 10);

    const result = await createBoli({
      animalTitle: title,
      category,
      imageKey: catObj.imageKey,
      city,
      weight: `${weight} kg`,
      age,
      breed,
      description,
      sellerId: user.id,
      sellerName: user.name,
      sellerPhone: user.phone,
      startingPrice: sp,
      minIncrement: 500,
      duration,
    });

    if (!result.ok) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Could Not Publish", result.error);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      "Boli Published!",
      `Your animal is now live for bidding. Duration: ${duration} day(s).`,
      [{ text: "View Boli", onPress: () => router.replace("/(tabs)/boli") }]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{ paddingTop: topPad + 12, paddingHorizontal: 20, paddingBottom: bottomPad + 40 }}
        bottomOffset={140}
        showsVerticalScrollIndicator={false}
      >
        {/* Back + Title */}
        <View style={styles.pageHeader}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Create Boli</Text>
              <Text style={[styles.pageAr, { color: colors.gold }]}>بولی</Text>
            </View>
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              List your animal for live auction
            </Text>
          </View>
        </View>

        {/* Fee Banner */}
        <View style={[styles.feeBanner, { backgroundColor: colors.gold + "15", borderColor: colors.gold + "44" }]}>
          <Feather name="info" size={15} color={colors.gold} />
          <Text style={[styles.feeText, { color: colors.gold }]}>
            Listing fee: <Text style={{ fontFamily: "Inter_700Bold" }}>Rs. {LISTING_FEE.toLocaleString()} PKR</Text> — one-time, refundable if no bids
          </Text>
        </View>

        {/* Step Indicator */}
        <StepIndicator step={step} colors={colors} />

        {/* STEP 1: Details */}
        {step === "details" && (
          <View style={styles.section}>
            <Label label="Animal Category *" colors={colors} />
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: category === cat.id ? colors.gold + "22" : colors.navyLight,
                      borderColor: category === cat.id ? colors.gold : colors.border,
                      borderWidth: category === cat.id ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.catText, { color: category === cat.id ? colors.gold : colors.foreground }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label label="Listing Title *" colors={colors} />
            <Input value={title} onChangeText={setTitle} placeholder="e.g. Premium Beetal Bakra – Show Grade" colors={colors} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Label label="Starting Price (Rs.) *" colors={colors} />
                <Input value={startingPrice} onChangeText={setStartingPrice} placeholder="30000" keyboardType="numeric" colors={colors} />
              </View>
              <View style={{ flex: 1 }}>
                <Label label="Weight (kg) *" colors={colors} />
                <Input value={weight} onChangeText={setWeight} placeholder="35" keyboardType="numeric" colors={colors} />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Label label="Age *" colors={colors} />
                <Input value={age} onChangeText={setAge} placeholder="2 years" colors={colors} />
              </View>
              <View style={{ flex: 1 }}>
                <Label label="Breed *" colors={colors} />
                <Input value={breed} onChangeText={setBreed} placeholder="Beetal" colors={colors} />
              </View>
            </View>

            <Label label="Location *" colors={colors} />
            <TouchableOpacity
              onPress={() => setLocationPickerOpen(true)}
              style={[
                styles.locationBtn,
                {
                  backgroundColor: city ? colors.teal + "12" : colors.navyLight,
                  borderColor: city ? colors.teal : colors.border,
                },
              ]}
            >
              <Feather name="map-pin" size={18} color={city ? colors.teal : colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                {city ? (
                  <>
                    <Text style={[styles.locationPrimary, { color: colors.foreground }]}>
                      {city}, {province}
                    </Text>
                    {streetAddress ? (
                      <Text style={[styles.locationSecondary, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {streetAddress}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={[styles.locationPlaceholder, { color: colors.mutedForeground }]}>
                    Select Province → City → Street
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <LocationPickerSheet
              visible={locationPickerOpen}
              onClose={() => setLocationPickerOpen(false)}
              onSelect={(loc: LocationResult) => {
                setProvince(loc.province);
                setCity(loc.city);
                setStreetAddress(loc.street);
              }}
              initial={{ province, city, street: streetAddress }}
            />

            <Label label="Auction Duration *" colors={colors} />
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  onPress={() => setDuration(d.value)}
                  style={[
                    styles.durationChip,
                    {
                      backgroundColor: duration === d.value ? colors.teal + "22" : colors.navyLight,
                      borderColor: duration === d.value ? colors.teal : colors.border,
                      borderWidth: duration === d.value ? 1.5 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.durationLabel, { color: duration === d.value ? colors.teal : colors.foreground }]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.durationHint, { color: colors.mutedForeground }]}>{d.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label label="Description (optional)" colors={colors} />
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Describe your animal: health, vaccinations, temperament..."
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={[styles.incrementNote, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={14} color={colors.teal} />
              <Text style={[styles.incrementText, { color: colors.mutedForeground }]}>
                Minimum bid increment is fixed at <Text style={{ color: colors.teal, fontFamily: "Inter_600SemiBold" }}>Rs. 500</Text> per bid.
              </Text>
            </View>

            <TouchableOpacity onPress={goToPayment} style={[styles.nextBtn, { backgroundColor: colors.gold }]}>
              <Text style={[styles.nextBtnText, { color: colors.navy }]}>Continue to Payment</Text>
              <Feather name="arrow-right" size={18} color={colors.navy} />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: Payment */}
        {step === "payment" && (
          <View style={styles.section}>
            <View style={[styles.paymentCard, { backgroundColor: colors.navyLight, borderColor: colors.gold + "44" }]}>
              <Text style={[styles.paymentTitle, { color: colors.gold }]}>Listing Fee</Text>
              <Text style={[styles.paymentAmount, { color: colors.foreground }]}>
                Rs. {LISTING_FEE.toLocaleString()}
              </Text>
              <Text style={[styles.paymentNote, { color: colors.mutedForeground }]}>
                One-time fee to publish your Boli listing. Refunded if no bids are received.
              </Text>
            </View>

            <Label label="Payment Method" colors={colors} />
            {(["easypaisa", "jazzcash", "card"] as const).map((method) => (
              <TouchableOpacity
                key={method}
                onPress={() => setPaymentMethod(method)}
                style={[
                  styles.payMethod,
                  {
                    backgroundColor: paymentMethod === method ? colors.teal + "15" : colors.navyLight,
                    borderColor: paymentMethod === method ? colors.teal : colors.border,
                    borderWidth: paymentMethod === method ? 1.5 : 1,
                  },
                ]}
              >
                <View style={[styles.payRadio, { borderColor: paymentMethod === method ? colors.teal : colors.border }]}>
                  {paymentMethod === method && <View style={[styles.payRadioFill, { backgroundColor: colors.teal }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.payMethodLabel, { color: colors.foreground }]}>
                    {method === "easypaisa" ? "Easypaisa" : method === "jazzcash" ? "JazzCash" : "Credit / Debit Card"}
                  </Text>
                  <Text style={[styles.payMethodSub, { color: colors.mutedForeground }]}>
                    {method === "card" ? "Visa, Mastercard, UnionPay" : "Mobile wallet payment"}
                  </Text>
                </View>
                <Feather name={paymentMethod === method ? "check-circle" : "circle"} size={18} color={paymentMethod === method ? colors.teal : colors.border} />
              </TouchableOpacity>
            ))}

            <View style={[styles.summaryBox, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
              {[
                { label: "Animal", value: title },
                { label: "Starting Price", value: `Rs. ${parseInt(startingPrice || "0").toLocaleString()}` },
                { label: "Duration", value: `${duration} day(s)` },
                { label: "Listing Fee", value: `Rs. ${LISTING_FEE.toLocaleString()}` },
              ].map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]} numberOfLines={1}>{row.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity onPress={() => setStep("details")} style={[styles.backActionBtn, { borderColor: colors.border }]}>
                <Feather name="arrow-left" size={16} color={colors.foreground} />
                <Text style={[styles.backActionText, { color: colors.foreground }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={processPayment}
                disabled={isProcessing}
                style={[styles.payBtn, { backgroundColor: isProcessing ? colors.gold + "88" : colors.gold }]}
              >
                {isProcessing ? (
                  <Text style={[styles.payBtnText, { color: colors.navy }]}>Processing...</Text>
                ) : (
                  <>
                    <Feather name="lock" size={16} color={colors.navy} />
                    <Text style={[styles.payBtnText, { color: colors.navy }]}>
                      Pay Rs. {LISTING_FEE.toLocaleString()}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: Confirm & Publish */}
        {step === "confirm" && (
          <View style={[styles.section, styles.confirmSection]}>
            <View style={[styles.successIcon, { backgroundColor: colors.gold + "22", borderColor: colors.gold }]}>
              <Feather name="check-circle" size={48} color={colors.gold} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Payment Successful!</Text>
            <Text style={[styles.confirmSub, { color: colors.mutedForeground }]}>
              Rs. {LISTING_FEE.toLocaleString()} received via {paymentMethod}. Your listing is ready to go live.
            </Text>

            <View style={[styles.summaryBox, { backgroundColor: colors.navyLight, borderColor: colors.gold + "33" }]}>
              <Text style={[styles.summaryTitle, { color: colors.gold }]}>Listing Preview</Text>
              {[
                { label: "Title", value: title },
                { label: "Category", value: category },
                { label: "Starting Price", value: `Rs. ${parseInt(startingPrice || "0").toLocaleString()}` },
                { label: "Min Increment", value: "Rs. 500" },
                { label: "Duration", value: `${duration} day(s)` },
                { label: "City", value: city },
              ].map((row) => (
                <View key={row.label} style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                  <Text style={[styles.summaryValue, { color: colors.foreground }]}>{row.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={publishListing} style={[styles.publishBtn, { backgroundColor: colors.teal }]}>
              <Feather name="zap" size={18} color={colors.navy} />
              <Text style={[styles.publishBtnText, { color: colors.navy }]}>Publish Boli Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function StepIndicator({ step, colors }: { step: Step; colors: any }) {
  const steps: Step[] = ["details", "payment", "confirm"];
  const labels = ["Animal Info", "Payment", "Publish"];
  const current = steps.indexOf(step);
  return (
    <View style={siStyles.row}>
      {steps.map((s, i) => (
        <View key={s} style={siStyles.item}>
          <View style={[siStyles.circle, { backgroundColor: i <= current ? colors.gold : colors.navyMid, borderColor: i <= current ? colors.gold : colors.border }]}>
            {i < current ? (
              <Feather name="check" size={13} color={colors.navy} />
            ) : (
              <Text style={[siStyles.num, { color: i === current ? colors.navy : colors.mutedForeground }]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[siStyles.label, { color: i <= current ? colors.gold : colors.mutedForeground }]}>{labels[i]}</Text>
          {i < steps.length - 1 && (
            <View style={[siStyles.line, { backgroundColor: i < current ? colors.gold : colors.border }]} />
          )}
        </View>
      ))}
    </View>
  );
}

function Label({ label, colors }: { label: string; colors: any }) {
  return <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>;
}

function Input({ value, onChangeText, placeholder, keyboardType, colors }: any) {
  return (
    <TextInput
      style={[styles.input, { backgroundColor: colors.navyLight, borderColor: colors.border, color: colors.foreground }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType || "default"}
    />
  );
}

const siStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  item: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  circle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  num: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 11, fontFamily: "Inter_500Medium" },
  line: { flex: 1, height: 2, borderRadius: 1 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 4 },
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  pageTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  pageAr: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  pageSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  feeBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  feeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  section: { gap: 8 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 8, marginBottom: 2 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  textarea: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  row: { flexDirection: "row", gap: 10 },
  catGrid: { gap: 8 },
  catChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  catText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cityChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  cityText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  durationRow: { flexDirection: "row", gap: 8 },
  durationChip: { flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1, paddingVertical: 12, gap: 2 },
  durationLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  durationHint: { fontSize: 10, fontFamily: "Inter_400Regular" },
  incrementNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 4 },
  incrementText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 12 },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  paymentCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 6, marginBottom: 8 },
  paymentTitle: { fontSize: 14, fontFamily: "Inter_500Medium" },
  paymentAmount: { fontSize: 32, fontFamily: "Inter_700Bold" },
  paymentNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  payMethod: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  payRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  payRadioFill: { width: 10, height: 10, borderRadius: 5 },
  payMethodLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  payMethodSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  summaryBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginVertical: 8 },
  summaryTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 13, fontFamily: "Inter_500Medium", maxWidth: "55%" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  backActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  backActionText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  payBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15 },
  payBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  confirmSection: { alignItems: "center" },
  successIcon: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  confirmTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  confirmSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, maxWidth: 280 },
  publishBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28, marginTop: 8, alignSelf: "stretch", justifyContent: "center" },
  publishBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  locationBtn: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  locationPrimary: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  locationSecondary: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  locationPlaceholder: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
