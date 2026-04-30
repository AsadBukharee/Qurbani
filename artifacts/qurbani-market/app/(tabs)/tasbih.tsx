import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
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

const PHRASES = [
  { arabic: "اللّٰهُ أَكْبَر", transliteration: "Allahu Akbar", meaning: "Allah is the Greatest", goal: 34 },
  { arabic: "سُبْحَانَ اللّٰهِ", transliteration: "SubhanAllah", meaning: "Glory be to Allah", goal: 33 },
  { arabic: "اَلْحَمْدُ لِلّٰه", transliteration: "Alhamdulillah", meaning: "All praise to Allah", goal: 33 },
  { arabic: "لَا إِلٰهَ إِلَّا اللّٰه", transliteration: "La ilaha illallah", meaning: "There is no god but Allah", goal: 100 },
  { arabic: "اَسْتَغْفِرُ اللّٰه", transliteration: "Astaghfirullah", meaning: "I seek Allah's forgiveness", goal: 100 },
];

export default function TasbihScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasbihCount, setTasbihCount, currentPhrase, setCurrentPhrase } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tapScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.4)).current;

  const phrase = PHRASES[currentPhrase];
  const progress = Math.min(tasbihCount / phrase.goal, 1);

  const handleTap = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.parallel([
        Animated.timing(tapScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(tapScale, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.4, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
    const next = tasbihCount + 1;
    setTasbihCount(next);
    if (next % phrase.goal === 0 && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleReset = () => {
    setTasbihCount(0);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNextPhrase = () => {
    setCurrentPhrase((currentPhrase + 1) % PHRASES.length);
    setTasbihCount(0);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const cycles = Math.floor(tasbihCount / phrase.goal);
  const currentInCycle = tasbihCount % phrase.goal;

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />
      <View style={[styles.container, { paddingTop: topPad + 16, paddingBottom: bottomPad + 80 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.moonDecor, { color: colors.gold }]}>☽ تسبیح ✦</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Digital Tasbih</Text>
        </View>

        {/* Phrase Selector */}
        <View style={[styles.phraseCard, { backgroundColor: colors.navyLight, borderColor: colors.gold + "44" }]}>
          <Text style={[styles.arabicMain, { color: colors.gold }]}>{phrase.arabic}</Text>
          <Text style={[styles.translit, { color: colors.teal }]}>{phrase.transliteration}</Text>
          <Text style={[styles.meaning, { color: colors.mutedForeground }]}>{phrase.meaning}</Text>
          <Text style={[styles.goalText, { color: colors.mutedForeground }]}>Goal: {phrase.goal}</Text>
        </View>

        {/* Progress Ring */}
        <View style={styles.progressSection}>
          <View style={[styles.progressRing, { borderColor: colors.navyMid }]}>
            <View
              style={[
                styles.progressFill,
                {
                  borderColor: colors.teal,
                  opacity: progress,
                  transform: [{ scale: 0.85 + progress * 0.15 }],
                },
              ]}
            />
            {/* Glow */}
            <Animated.View
              style={[
                styles.glow,
                { backgroundColor: colors.teal, opacity: glowOpacity },
              ]}
            />
            {/* Main Tap Button */}
            <Animated.View style={{ transform: [{ scale: tapScale }] }}>
              <TouchableOpacity
                onPress={handleTap}
                style={[
                  styles.tapButton,
                  {
                    backgroundColor: colors.teal + "22",
                    borderColor: colors.teal,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text style={[styles.countNumber, { color: colors.teal }]}>
                  {currentInCycle}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {cycles > 0 && (
            <View style={[styles.cyclesBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}>
              <Feather name="refresh-cw" size={12} color={colors.gold} />
              <Text style={[styles.cyclesText, { color: colors.gold }]}>
                {cycles} cycle{cycles > 1 ? "s" : ""} complete
              </Text>
            </View>
          )}

          <Text style={[styles.totalCount, { color: colors.mutedForeground }]}>
            Total: {tasbihCount}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.actionBtn, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
          >
            <Feather name="refresh-ccw" size={18} color={colors.mutedForeground} />
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNextPhrase}
            style={[styles.actionBtn, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
          >
            <Feather name="skip-forward" size={18} color={colors.teal} />
            <Text style={[styles.actionText, { color: colors.teal }]}>Next Phrase</Text>
          </TouchableOpacity>
        </View>

        {/* Phrase List */}
        <View style={styles.phraseList}>
          {PHRASES.map((p, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => { setCurrentPhrase(i); setTasbihCount(0); }}
              style={[
                styles.phraseItem,
                {
                  backgroundColor: i === currentPhrase ? colors.teal + "15" : "transparent",
                  borderColor: i === currentPhrase ? colors.teal + "44" : colors.border,
                },
              ]}
            >
              <Text style={[styles.phraseAr, { color: i === currentPhrase ? colors.gold : colors.foreground }]}>
                {p.arabic}
              </Text>
              <View style={styles.phraseMeta}>
                <Text style={[styles.phraseEn, { color: colors.mutedForeground }]}>{p.transliteration}</Text>
                <Text style={[styles.phraseGoal, { color: colors.mutedForeground }]}>×{p.goal}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    gap: 4,
  },
  moonDecor: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  phraseCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  arabicMain: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  translit: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  meaning: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  goalText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressSection: {
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  progressFill: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
  },
  glow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    filter: [{ blur: 30 }] as any,
  },
  tapButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  countNumber: {
    fontSize: 64,
    fontFamily: "Inter_700Bold",
  },
  cyclesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  cyclesText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  totalCount: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  phraseList: {
    width: "100%",
    gap: 8,
  },
  phraseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  phraseAr: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  phraseMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  phraseEn: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  phraseGoal: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
