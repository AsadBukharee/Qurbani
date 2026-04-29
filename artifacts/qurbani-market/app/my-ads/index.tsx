import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { animals as animalsApi, isApiEnabled, type ApiMyAd } from "@/lib/api";

const STATUS_CONFIG: Record<
  string,
  { icon: string; label: string; colorKey: string }
> = {
  draft: { icon: "edit-3", label: "Draft", colorKey: "mutedForeground" },
  published: { icon: "globe", label: "Live", colorKey: "teal" },
  inactive: { icon: "eye-off", label: "Inactive", colorKey: "destructive" },
  scheduled: { icon: "clock", label: "Scheduled", colorKey: "gold" },
};

export default function MyAdsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [ads, setAds] = useState<ApiMyAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAds = useCallback(async () => {
    if (!isApiEnabled()) {
      setLoading(false);
      return;
    }
    try {
      const data = await animalsApi.myAds();
      setAds(data);
    } catch (err) {
      console.warn("[my-ads] load failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleToggleStatus = async (ad: ApiMyAd) => {
    try {
      await animalsApi.toggleStatus(ad.id);
      loadAds();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not update status.");
    }
  };

  const handleDelete = (ad: ApiMyAd) => {
    Alert.alert("Remove Ad", `Remove "${ad.title}"? It will become inactive.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await animalsApi.delete(ad.id);
            loadAds();
          } catch (err: any) {
            Alert.alert("Error", err?.message || "Could not remove ad.");
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    const conf = STATUS_CONFIG[status];
    if (!conf) return colors.mutedForeground;
    return (colors as any)[conf.colorKey] || colors.mutedForeground;
  };

  const renderAd = ({ item }: { item: ApiMyAd }) => {
    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft;
    const sc = getStatusColor(item.status);
    const coverUrl =
      item.cover_image ||
      (item.images && item.images.length > 0 ? item.images[0] : null);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/animal/${item.id}`)}
        style={[
          styles.adCard,
          { backgroundColor: colors.navyLight, borderColor: colors.border },
        ]}
      >
        {/* Thumbnail */}
        <View style={styles.thumbContainer}>
          {coverUrl && !coverUrl.includes("_featured") ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.thumbnail,
                styles.thumbPlaceholder,
                { backgroundColor: colors.navyMid },
              ]}
            >
              <Feather name="image" size={24} color={colors.mutedForeground} />
            </View>
          )}
          {/* Status overlay */}
          <View
            style={[styles.statusOverlay, { backgroundColor: sc + "22" }]}
          >
            <Feather
              name={statusConf.icon as any}
              size={12}
              color={sc}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.adInfo}>
          <Text
            style={[styles.adTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.adMeta, { color: colors.mutedForeground }]}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)} •{" "}
            {item.city}
          </Text>
          <Text style={[styles.adPrice, { color: colors.gold }]}>
            Rs. {item.price.toLocaleString()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: sc + "18" }]}>
            <View
              style={[styles.statusDot, { backgroundColor: sc }]}
            />
            <Text style={[styles.statusText, { color: sc }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.adActions}>
          {item.status === "published" || item.status === "inactive" ? (
            <TouchableOpacity
              onPress={() => handleToggleStatus(item)}
              style={[styles.actionBtn, { borderColor: sc + "44" }]}
            >
              <Feather
                name={item.status === "published" ? "eye-off" : "eye"}
                size={14}
                color={sc}
              />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[
              styles.actionBtn,
              { borderColor: colors.destructive + "44" },
            ]}
          >
            <Feather name="trash-2" size={14} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          My Ads
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.teal} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading your ads...
          </Text>
        </View>
      ) : ads.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No Ads Yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Create your first ad to start selling animals
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/my-ads/create")}
            style={[styles.createFirstBtn, { backgroundColor: colors.teal }]}
          >
            <Feather name="plus" size={18} color={colors.navy} />
            <Text style={[styles.createFirstText, { color: colors.navy }]}>
              Create Ad
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          renderItem={renderAd}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: bottomPad + 80,
            gap: 12,
          }}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadAds();
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB: Create Ad */}
      <TouchableOpacity
        onPress={() => router.push("/my-ads/create")}
        style={[
          styles.fab,
          {
            backgroundColor: colors.teal,
            bottom: bottomPad + 20,
            shadowColor: colors.teal,
          },
        ]}
      >
        <Feather name="plus" size={20} color={colors.navy} />
        <Text style={[styles.fabText, { color: colors.navy }]}>Create Ad</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  createFirstBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  createFirstText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  adCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 12,
  },
  thumbContainer: {
    position: "relative",
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adInfo: {
    flex: 1,
    gap: 2,
  },
  adTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  adMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  adPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  adActions: {
    gap: 8,
    alignItems: "center",
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
