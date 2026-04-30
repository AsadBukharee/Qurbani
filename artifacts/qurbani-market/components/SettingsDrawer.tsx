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
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { useT, useUrduTextStyle } from "@/lib/i18n";

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
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const t = useT();
  const urdu = useUrduTextStyle();
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
      icon: "shopping-cart" as const,
      label: "My Cart",
      sublabel: cartCount > 0 ? `${cartCount} item${cartCount > 1 ? "s" : ""} in cart` : "View saved animals",
      color: colors.teal,
      badge: cartCount > 0 ? cartCount : undefined,
      onPress: () => {
        onClose();
        router.push("/cart");
      },
    },
    {
      icon: "shopping-bag" as const,
      label: "My Purchases",
      sublabel: "View order history & invoices",
      color: colors.gold,
      onPress: () => {
        onClose();
        router.push("/purchases");
      },
    },
    {
      icon: "globe" as const,
      label: language === "en" ? t("drawer.languageEnglish") : t("drawer.languageUrdu"),
      sublabel: t("drawer.tapToSwitch"),
      color: colors.teal,
      onPress: async () => {
        const newLang = language === "en" ? "ur" : "en";
        await setLanguage(newLang as "en" | "ur");
      },
    },
    {
      icon: "bell" as const,
      label: t("drawer.notifications"),
      sublabel: t("drawer.notifications.sub"),
      color: colors.gold,
      onPress: () => {
        onClose();
        router.push("/notifications");
      },
    },
    {
      icon: "heart" as const,
      label: t("drawer.wishlist"),
      sublabel: t("drawer.wishlist.sub"),
      color: "#FF4B6E",
      onPress: () => {
        onClose();
        router.push("/wishlist");
      },
    },
    {
      icon: "credit-card" as const,
      label: t("drawer.wallet"),
      sublabel: t("drawer.wallet.sub"),
      color: colors.teal,
      onPress: () => {
        onClose();
        router.push("/wallet");
      },
    },
    {
      icon: (theme === "dark" ? "sun" : "moon") as "sun" | "moon",
      label: theme === "dark" ? t("drawer.lightTheme") : t("drawer.darkTheme"),
      sublabel: t("drawer.theme.sub"),
      color: theme === "dark" ? colors.gold : colors.teal,
      onPress: () => {
        toggleTheme();
      },
    },
    {
      icon: "list" as const,
      label: t("drawer.myAds"),
      sublabel: t("drawer.myAds.sub"),
      color: colors.gold,
      onPress: () => {
        onClose();
        router.push("/my-ads");
      },
    },
  ];

  const handleSignOff = () => {
    Alert.alert(
      t("drawer.signOut.confirm.title"),
      t("drawer.signOut.confirm.body"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("drawer.signOut"),
          style: "destructive",
          onPress: async () => {
            onClose();
            await logout();
            router.replace("/auth/login");
          },
        },
      ],
    );
  };

  const handleOpenProfile = () => {
    onClose();
    router.push("/(tabs)/profile");
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
          <Text style={[styles.drawerTitle, { color: colors.foreground }, urdu]}>
            {t("drawer.settings")}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* User info — tap to open profile */}
        {user && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleOpenProfile}
            accessibilityRole="button"
            accessibilityLabel={t("drawer.viewProfile")}
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
              <Text style={[styles.userName, { color: colors.foreground }, urdu]}>
                {user.name}
              </Text>
              <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
                {user.phone}
              </Text>
              <Text
                style={[
                  styles.userPhone,
                  { color: colors.teal, marginTop: 2 },
                  urdu,
                ]}
              >
                {t("drawer.viewProfile")} ›
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
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
                {(item as any).badge ? (
                  <View style={[styles.badge, { backgroundColor: item.color }]}>
                    <Text style={styles.badgeText}>{(item as any).badge}</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: colors.foreground }, urdu]}>
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.menuSublabel,
                    { color: colors.mutedForeground },
                    urdu,
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
            <Text style={[styles.signOffText, { color: colors.destructive }, urdu]}>
              {t("drawer.signOut")}
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
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
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
