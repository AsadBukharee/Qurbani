import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarryBackground } from "@/components/StarryBackground";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const LANGUAGES = [
  {
    code: "en" as const,
    label: "English",
    native: "English",
    flag: "🇬🇧",
    desc: "Continue in English",
  },
  {
    code: "ur" as const,
    label: "Urdu",
    native: "اردو",
    flag: "🇵🇰",
    desc: "اردو میں جاری رکھیں",
  },
];

export default function LanguageSelectScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setLanguage, language } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSelect = async (lang: "en" | "ur") => {
    await setLanguage(lang);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />
      <View style={[styles.container, { paddingTop: topPad + 40 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.moonDecor, { color: colors.gold }]}>
            ☽ ✦ ☾
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Select Language
          </Text>
          <Text style={[styles.titleAr, { color: colors.gold }]}>
            زبان منتخب کریں
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose your preferred language
          </Text>
        </View>

        {/* Language Cards */}
        <View style={styles.cardsContainer}>
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
                style={[
                  styles.langCard,
                  {
                    backgroundColor: isSelected
                      ? colors.teal + "18"
                      : colors.navyLight,
                    borderColor: isSelected ? colors.teal : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text
                    style={[
                      styles.langLabel,
                      { color: isSelected ? colors.teal : colors.foreground },
                    ]}
                  >
                    {lang.label}
                  </Text>
                  <Text
                    style={[
                      styles.langNative,
                      {
                        color: isSelected
                          ? colors.teal + "cc"
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {lang.native}
                  </Text>
                  <Text
                    style={[
                      styles.langDesc,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {lang.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? colors.teal : colors.border,
                      backgroundColor: isSelected
                        ? colors.teal
                        : "transparent",
                    },
                  ]}
                >
                  {isSelected && (
                    <Feather name="check" size={14} color={colors.navy} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info text */}
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          You can change this later in Settings
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    gap: 8,
  },
  moonDecor: {
    fontSize: 24,
    letterSpacing: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  titleAr: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  cardsContainer: {
    width: "100%",
    gap: 16,
  },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 18,
    padding: 20,
  },
  flag: {
    fontSize: 36,
  },
  langInfo: {
    flex: 1,
    gap: 2,
  },
  langLabel: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  langNative: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  langDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 24,
    textAlign: "center",
  },
});
