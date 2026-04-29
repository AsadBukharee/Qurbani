import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();

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
          fontSize: 11,
          fontFamily: "Inter_500Medium",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => (
            <Feather name="search" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="boli"
        options={{
          title: "Boli",
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
      <Tabs.Screen
        name="karwan"
        options={{
          title: "Karwan",
          tabBarIcon: ({ color, focused }) => (
            <Feather
              name="truck"
              size={22}
              color={focused ? colors.gold : color}
            />
          ),
          tabBarActiveTintColor: colors.gold,
        }}
      />
      {/* Tasbih removed from bottom nav per design — file kept so deep links still work */}
      <Tabs.Screen
        name="tasbih"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
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
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
