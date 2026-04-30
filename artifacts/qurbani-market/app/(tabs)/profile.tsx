import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarryBackground } from "@/components/StarryBackground";
import { AnimalCard } from "@/components/AnimalCard";
import { useApp } from "@/contexts/AppContext";
import { useCart } from "@/contexts/CartContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, logout, listings, favorites } = useApp();
  const { cartCount, purchases } = useCart();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const myListings = listings.filter((l) => l.seller.id === user?.id || l.seller.id === "me");
  const favListings = listings.filter((l) => favorites.includes(l.id));

  if (!isAuthenticated) {
    return (
      <View style={[styles.root, { backgroundColor: colors.navy }]}>
        <StarryBackground />
        <View style={[styles.authPrompt, { paddingTop: topPad + 60 }]}>
          <Text style={[styles.moonDecor, { color: colors.gold }]}>☽ ✦ ☾</Text>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            Join Qurbani Market
          </Text>
          <Text style={[styles.authSub, { color: colors.mutedForeground }]}>
            Sign in to sell animals, save favorites & manage your listings
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={[styles.signInBtn, { backgroundColor: colors.teal }]}
          >
            <Feather name="log-in" size={18} color={colors.navy} />
            <Text style={[styles.signInBtnText, { color: colors.navy }]}>
              Sign In / Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingHorizontal: 20,
          paddingBottom: bottomPad + 80,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.navyLight, borderColor: colors.gold + "33" }]}>
          <View style={[styles.avatar, { backgroundColor: colors.teal + "22", borderColor: colors.teal }]}>
            <Text style={[styles.avatarText, { color: colors.teal }]}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || "User"}</Text>
            <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user?.phone || ""}</Text>
            <View style={[styles.roleBadge, { backgroundColor: colors.gold + "22", borderColor: colors.gold + "44" }]}>
              <Text style={[styles.roleText, { color: colors.gold }]}>
                {user?.role === "seller" ? "Seller" : "Buyer"}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "My Listings", value: myListings.length.toString(), icon: "list" },
            { label: "Favorites", value: favListings.length.toString(), icon: "heart" },
            { label: "Rating", value: "5.0", icon: "star" },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
              <Feather name={stat.icon as any} size={18} color={colors.teal} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* My Listings */}
        {myListings.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Listings</Text>
            {myListings.map((listing) => (
              <AnimalCard
                key={listing.id}
                listing={listing}
                onPress={() => router.push(`/animal/${listing.id}`)}
              />
            ))}
          </View>
        )}

        {/* Favorites */}
        {favListings.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Saved Animals</Text>
            {favListings.map((listing) => (
              <AnimalCard
                key={listing.id}
                listing={listing}
                onPress={() => router.push(`/animal/${listing.id}`)}
              />
            ))}
          </View>
        )}

        {favListings.length === 0 && myListings.length === 0 && (
          <View style={styles.emptySection}>
            <Feather name="heart" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No favorites or listings yet
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/listings")}
              style={[styles.browseBtn, { borderColor: colors.teal }]}
            >
              <Text style={[styles.browseBtnText, { color: colors.teal }]}>Browse Animals</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cart & Purchases Row */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            onPress={() => router.push("/cart")}
            style={[styles.quickBtn, { backgroundColor: colors.navyLight, borderColor: colors.teal + "44" }]}
          >
            <Feather name="shopping-cart" size={20} color={colors.teal} />
            {cartCount > 0 && (
              <View style={[styles.quickBadge, { backgroundColor: colors.teal }]}>
                <Text style={styles.quickBadgeText}>{cartCount}</Text>
              </View>
            )}
            <Text style={[styles.quickBtnText, { color: colors.teal }]}>My Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/purchases")}
            style={[styles.quickBtn, { backgroundColor: colors.navyLight, borderColor: colors.gold + "44" }]}
          >
            <Feather name="shopping-bag" size={20} color={colors.gold} />
            {purchases.length > 0 && (
              <View style={[styles.quickBadge, { backgroundColor: colors.gold }]}>
                <Text style={styles.quickBadgeText}>{purchases.length}</Text>
              </View>
            )}
            <Text style={[styles.quickBtnText, { color: colors.gold }]}>Orders</Text>
          </TouchableOpacity>
        </View>

        {/* My Ads */}
        <TouchableOpacity
          onPress={() => router.push("/my-ads")}
          style={[styles.settingsBtn, { backgroundColor: colors.navyLight, borderColor: colors.gold + "44" }]}
        >
          <Feather name="list" size={18} color={colors.gold} />
          <Text style={[styles.settingsBtnText, { color: colors.gold }]}>My Ads</Text>
          <Feather name="chevron-right" size={16} color={colors.gold + "88"} />
        </TouchableOpacity>

        {/* Messages */}
        <TouchableOpacity
          onPress={() => router.push("/chat")}
          style={[styles.settingsBtn, { backgroundColor: colors.navyLight, borderColor: colors.teal + "44" }]}
        >
          <Feather name="message-square" size={18} color={colors.teal} />
          <Text style={[styles.settingsBtnText, { color: colors.teal }]}>Messages</Text>
          <Feather name="chevron-right" size={16} color={colors.teal + "88"} />
        </TouchableOpacity>

        {/* Seller Settings */}
        {user?.role === "seller" && (
          <TouchableOpacity
            onPress={() => router.push("/seller/settings")}
            style={[styles.settingsBtn, { backgroundColor: colors.navyLight, borderColor: colors.gold + "44" }]}
          >
            <Feather name="tag" size={18} color={colors.gold} />
            <Text style={[styles.settingsBtnText, { color: colors.gold }]}>Coupon &amp; Discount Settings</Text>
            <Feather name="chevron-right" size={16} color={colors.gold + "88"} />
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive", onPress: logout },
            ]);
          }}
          style={[styles.logoutBtn, { borderColor: colors.destructive + "44" }]}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  authPrompt: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  moonDecor: {
    fontSize: 24,
    letterSpacing: 8,
    marginBottom: 8,
  },
  authTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  authSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  userPhone: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  browseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  browseBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  quickBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  quickBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  quickBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  settingsBtnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
