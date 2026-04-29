import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ visible, onClose }: SettingsDrawerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, language, setLanguage, logout } = useApp();
  const { theme, toggleTheme } = useTheme();
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : DRAWER_WIDTH,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  const menuItems = [
    {
      icon: "globe" as const,
      label: language === "en" ? "Language: English" : "زبان: اردو",
      sublabel: "Tap to switch",
      color: colors.teal,
      onPress: async () => {
        const newLang = language === "en" ? "ur" : "en";
        await setLanguage(newLang as "en" | "ur");
      },
    },
    {
      icon: "bell" as const,
      label: "Notifications",
      sublabel: "View all alerts",
      color: colors.gold,
      onPress: () => {
        onClose();
        // Navigate to notifications - can be extended
      },
    },
    {
      icon: "heart" as const,
      label: "Wishlist",
      sublabel: "Your saved animals",
      color: "#FF4B6E",
      onPress: () => {
        onClose();
        router.push("/wishlist");
      },
    },
    {
      icon: "credit-card" as const,
      label: "Wallet",
      sublabel: "Manage funds",
      color: colors.teal,
      onPress: () => {
        onClose();
        router.push("/wallet");
      },
    },
    {
      icon: (theme === "dark" ? "sun" : "moon") as "sun" | "moon",
      label: theme === "dark" ? "Light Theme" : "Dark Theme",
      sublabel: "Tap to switch appearance",
      color: theme === "dark" ? colors.gold : colors.teal,
      onPress: () => {
        toggleTheme();
      },
    },
    {
      icon: "list" as const,
      label: "My Ads",
      sublabel: "Manage your listings",
      color: colors.gold,
      onPress: () => {
        onClose();
        router.push("/my-ads");
      },
    },
  ];

  const handleSignOff = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          onClose();
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[styles.backdrop, { opacity }]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.navyLight,
            borderLeftColor: colors.border,
            transform: [{ translateX }],
            paddingTop: topPad + 12,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.drawerHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.drawerTitle, { color: colors.foreground }]}>
            Settings
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* User info */}
        {user && (
          <View
            style={[
              styles.userCard,
              { backgroundColor: colors.navy, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.teal + "22", borderColor: colors.teal },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.teal }]}>
                {user.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {user.name}
              </Text>
              <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
                {user.phone}
              </Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <ScrollView
          style={styles.menuList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 4 }}
        >
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={item.onPress}
              style={[
                styles.menuItem,
                { backgroundColor: colors.navy + "88" },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIcon,
                  { backgroundColor: item.color + "18" },
                ]}
              >
                <Feather name={item.icon} size={18} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.menuSublabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.sublabel}
                </Text>
              </View>
              <Feather
                name="chevron-right"
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sign Off Button */}
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}>
          <TouchableOpacity
            onPress={handleSignOff}
            style={[styles.signOffBtn, { borderColor: colors.destructive + "44" }]}
          >
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={[styles.signOffText, { color: colors.destructive }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: 1,
    elevation: 16,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  userName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  userPhone: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  menuSublabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  signOffBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
  },
  signOffText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
