import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useT, useLang } from "@/lib/i18n";
import { useApp } from "@/contexts/AppContext";

export default function TabLayout() {
  const colors = useColors();
  const t = useT();
  const lang = useLang();
  const { user, platformConfig } = useApp();
  const tabLabelFont = lang === "ur" ? "NotoNastaliqUrdu_400Regular" : "Inter_500Medium";

  const handleContactUs = () => {
    const rawNumber = (platformConfig as any)?.whatsapp_number ?? "+923417070873";
    const number = rawNumber.replace(/[^0-9]/g, "");
    const name = encodeURIComponent(user?.name ?? "Guest");
    const msg = encodeURIComponent(`Hi, I am ${user?.name ?? "a user"}. I need help.`);
    const url = `https://wa.me/${number}?text=${msg}`;
    Linking.openURL(url).catch(() => Alert.alert("WhatsApp not installed", "Please install WhatsApp to contact us."));
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: colors.navyLight,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: Platform.OS === "web" ? 84 : 64,
          paddingBottom: Platform.OS === "web" ? 24 : 10,
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.navyLight },
            ]}
          />
        ),
        tabBarLabelStyle: {
          fontSize: lang === "ur" ? 12 : 11,
          fontFamily: tabLabelFont,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.home"),
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: t("tab.search"),
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="boli"
        options={{
          title: t("tab.boli"),
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="trending-up"
              size={22}
              color={focused ? colors.gold : color}
            />
          ),
          tabBarActiveTintColor: colors.gold,
        }}
      />
      {/* Karwan — hidden from nav but kept so deep links still work */}
      <Tabs.Screen
        name="karwan"
        options={{
          href: null,
        }}
      />
      {/* Contact Us — opens WhatsApp, no screen needed */}
      <Tabs.Screen
        name="tasbih"
        options={{
          title: "Contact Us",
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={22} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...(props as any)}
              onPress={handleContactUs}
              style={[props.style, { alignItems: "center", justifyContent: "center" }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: t("tab.inbox"),
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="message-circle" size={22} color={color} />
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  backgroundColor: colors.gold,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: colors.navyLight,
                }}
              >
                <Text style={{ fontSize: 8, fontFamily: "Inter_700Bold", color: colors.navy }}>
                  2
                </Text>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tab.profile"),
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
