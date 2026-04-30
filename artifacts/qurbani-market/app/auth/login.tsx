import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { StarryBackground } from "@/components/StarryBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/contexts/ThemeContext";
import { normalizePhone } from "@/lib/api";

type Mode = "login" | "register";

export default function LoginScreen() {
  const colors = useColors();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { loginWithCredentials, registerWithCredentials } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Normalize: drop spaces/dashes and strip any leading zero after +92,
  // so "03417070873" or "+9203417070873" both become "+923417070873".
  const fullPhone = normalizePhone(
    phone.startsWith("+") ? phone : `+92${phone}`
  );

  const handleForgotPassword = () => {
    const userName = name.trim() || "User";
    const userPhone = fullPhone || phone || "not provided";
    const message = encodeURIComponent(
      `Assalamu Alaikum,\n\nI forgot my Qurbani Market password and need help resetting it.\n\nName: ${userName}\nPhone: ${userPhone}\n\nPlease assist me. JazakAllah Khair.`
    );
    const supportPhone = "923001234567";
    const url = `https://wa.me/${supportPhone}?text=${message}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Not Available", "Please install WhatsApp or contact support at +92 300 1234567.");
    });
  };

  const handleSubmit = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number.");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("Password", "Password must be at least 6 characters.");
      return;
    }
    if (mode === "register" && (!name || name.trim().length < 2)) {
      Alert.alert("Name Required", "Please enter your full name.");
      return;
    }

    setIsLoading(true);
    const result =
      mode === "login"
        ? await loginWithCredentials(fullPhone, password)
        : await registerWithCredentials({
            phone: fullPhone,
            name: name.trim(),
            password,
            role,
          });
    setIsLoading(false);

    if (!result.ok) {
      Alert.alert(
        mode === "login" ? "Login Failed" : "Registration Failed",
        result.error
      );
      return;
    }
    // First-time login or register: show language selection
    if (mode === "register" || !result.user.preferredLanguage) {
      router.replace("/auth/language-select");
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {theme === "dark" && <StarryBackground />}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <View style={{ flex: 1 }} />
        <ThemeToggle />
      </View>

      <KeyboardAwareScrollViewCompat
        bottomOffset={120}
        contentContainerStyle={[styles.container, { paddingTop: 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.bismillah, { color: colors.gold }]}>
            بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ
          </Text>
          <Text style={[styles.moonDecor, { color: colors.gold }]}>☽ ✦ ☾</Text>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Qurbani Market
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Buy & Sell Animals with Trust
          </Text>
        </View>

        {/* Mode Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          {(["login", "register"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.tab,
                mode === m && { backgroundColor: colors.teal + "22" },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === m ? colors.teal : colors.mutedForeground },
                ]}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Auth Card */}
        <View style={[styles.card, { backgroundColor: colors.navyLight, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {mode === "login" ? "Welcome back" : "Create your account"}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              {mode === "login"
                ? "Sign in with your phone and password"
                : "Sign up to buy, sell, and bid on animals"}
            </Text>
          </View>

          {mode === "register" && (
            <>
              <Label colors={colors}>Full Name</Label>
              <TextInput
                style={[styles.input, { backgroundColor: colors.navyMid, borderColor: colors.border, color: colors.foreground }]}
                placeholder="e.g. Muhammad Ali"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </>
          )}

          <Label colors={colors}>Phone Number</Label>
          <View style={[styles.phoneInput, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
            <View style={[styles.countryCode, { borderRightColor: colors.border }]}>
              <Text style={[styles.countryCodeText, { color: colors.foreground }]}>🇵🇰 +92</Text>
            </View>
            <TextInput
              style={[styles.phoneField, { color: colors.foreground }]}
              placeholder="3001234567"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={11}
            />
          </View>

          <Label colors={colors}>Password</Label>
          <View style={[styles.phoneInput, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
            <TextInput
              style={[styles.passwordField, { color: colors.foreground }]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              style={styles.eyeBtn}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {mode === "login" && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Feather name="message-circle" size={14} color="#25D366" />
              <Text style={[styles.forgotText, { color: "#25D366" }]}>
                Forgot Password? Get help on WhatsApp
              </Text>
            </TouchableOpacity>
          )}

          {mode === "register" && (
            <>
              <Text style={[styles.roleLabel, { color: colors.mutedForeground }]}>I want to:</Text>
              <View style={styles.roleRow}>
                {(["buyer", "seller"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor:
                          role === r ? colors.teal + "18" : colors.navyMid,
                        borderColor: role === r ? colors.teal : colors.border,
                        borderWidth: role === r ? 1.5 : 1,
                      },
                    ]}
                  >
                    <Feather
                      name={r === "buyer" ? "shopping-bag" : "tag"}
                      size={18}
                      color={role === r ? colors.teal : colors.mutedForeground}
                    />
                    <Text style={[styles.roleChipText, { color: role === r ? colors.teal : colors.foreground }]}>
                      {r === "buyer" ? "Buy Animals" : "Sell Animals"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={[styles.primaryBtn, { backgroundColor: isLoading ? colors.teal + "88" : colors.teal }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.isLight ? "#fff" : colors.navy }]}>
              {isLoading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </Text>
            {!isLoading && (
              <Feather
                name={mode === "login" ? "arrow-right" : "check"}
                size={18}
                color={colors.isLight ? "#fff" : colors.navy}
              />
            )}
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
            Browse without signing in
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function Label({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  container: { paddingHorizontal: 24, alignItems: "center", paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 20, gap: 6 },
  bismillah: { fontSize: 14, fontFamily: "Inter_400Regular", letterSpacing: 1, textAlign: "center" },
  moonDecor: { fontSize: 22, letterSpacing: 10, marginVertical: 4 },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular" },
  tabBar: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4, width: "100%", marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: { width: "100%", borderRadius: 20, borderWidth: 1, padding: 24, gap: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 4 },
  cardHeader: { gap: 4, marginBottom: 4 },
  cardTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 4, marginBottom: -6 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  phoneInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  countryCode: { paddingHorizontal: 12, paddingVertical: 13, borderRightWidth: 1 },
  countryCodeText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  phoneField: { flex: 1, paddingHorizontal: 12, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  passwordField: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  roleLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  roleRow: { gap: 10 },
  roleChip: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  roleChipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  termsText: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17, marginTop: 4 },
  forgotBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-end", marginTop: -4 },
  forgotText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  skipBtn: { marginTop: 18, paddingVertical: 10 },
  skipText: { fontSize: 13, fontFamily: "Inter_400Regular", textDecorationLine: "underline" },
});
