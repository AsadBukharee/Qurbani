import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StarryBackground } from "@/components/StarryBackground";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import {
  apiErrorMessage,
  isApiEnabled,
  notifications as notificationsApi,
} from "@/lib/api";

type NotificationType =
  | "chat"
  | "new_bid"
  | "outbid"
  | "boli_won"
  | "boli_ended"
  | "animal_approved"
  | "animal_rejected"
  | "system"
  | string;

interface NotificationItem {
  id: string;
  type?: NotificationType;
  title?: string;
  body?: string;
  message?: string;
  text?: string;
  read?: boolean;
  is_read?: boolean;
  created_at?: string;
  timestamp?: string;
  data?: Record<string, any>;
  // Some backends flatten payload fields
  room_id?: string | number;
  animal_id?: string | number;
  boli_id?: string | number;
}

function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.results)) return data.results as T[];
  return [];
}

function isUnread(n: NotificationItem): boolean {
  if (typeof n.read === "boolean") return !n.read;
  if (typeof n.is_read === "boolean") return !n.is_read;
  return false;
}

function bodyOf(n: NotificationItem): string {
  return n.body ?? n.message ?? n.text ?? "";
}

function timeOf(n: NotificationItem): string | undefined {
  return n.created_at ?? n.timestamp;
}

function formatStamp(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 86_400_000 * 7)
    return `${Math.floor(diff / 86_400_000)}d`;
  return d.toLocaleDateString();
}

interface IconSpec {
  name: React.ComponentProps<typeof Feather>["name"];
  color: string;
}

function iconFor(
  type: NotificationType | undefined,
  colors: ReturnType<typeof useColors>
): IconSpec {
  switch (type) {
    case "chat":
      return { name: "message-circle", color: colors.teal };
    case "new_bid":
    case "outbid":
      return { name: "trending-up", color: colors.gold };
    case "boli_won":
      return { name: "award", color: colors.gold };
    case "boli_ended":
      return { name: "flag", color: colors.mutedForeground };
    case "animal_approved":
      return { name: "check-circle", color: "#4CAF50" };
    case "animal_rejected":
      return { name: "x-circle", color: colors.destructive };
    default:
      return { name: "bell", color: colors.teal };
  }
}

function deepLinkFor(n: NotificationItem):
  | { pathname: string; params?: Record<string, string> }
  | null {
  const data = (n.data ?? {}) as Record<string, any>;
  const roomId = n.room_id ?? data.room_id;
  const boliId = n.boli_id ?? data.boli_id;
  const animalId = n.animal_id ?? data.animal_id;

  if (n.type === "chat" && roomId != null) {
    return { pathname: "/chat/[id]", params: { id: String(roomId) } };
  }
  if ((n.type === "new_bid" || n.type === "outbid" || n.type === "boli_won" || n.type === "boli_ended") && boliId != null) {
    return { pathname: "/boli/[id]", params: { id: String(boliId) } };
  }
  if ((n.type === "animal_approved" || n.type === "animal_rejected") && animalId != null) {
    return { pathname: "/animal/[id]", params: { id: String(animalId) } };
  }
  // Generic fallbacks based on whatever id is present
  if (roomId != null) return { pathname: "/chat/[id]", params: { id: String(roomId) } };
  if (boliId != null) return { pathname: "/boli/[id]", params: { id: String(boliId) } };
  if (animalId != null) return { pathname: "/animal/[id]", params: { id: String(animalId) } };
  return null;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isApiEnabled() || !isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await notificationsApi.list();
      const list = unwrap<NotificationItem>(data);
      list.sort((a, b) => {
        const ta = new Date(timeOf(a) ?? 0).getTime();
        const tb = new Date(timeOf(b) ?? 0).getTime();
        return tb - ta;
      });
      setItems(list);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load notifications."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      load();
      const interval = setInterval(() => {
        if (!cancelled) load();
      }, 15_000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [load])
  );

  const unreadCount = items.filter(isUnread).length;

  const handleMarkAllRead = useCallback(async () => {
    if (marking || unreadCount === 0) return;
    setMarking(true);
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
    } catch (err) {
      setError(apiErrorMessage(err, "Could not mark notifications as read."));
    } finally {
      setMarking(false);
    }
  }, [marking, unreadCount]);

  const handleOpen = useCallback(
    async (n: NotificationItem) => {
      // Optimistically mark this one as read (fire and forget)
      if (isUnread(n)) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read: true, is_read: true } : x
          )
        );
        try {
          await notificationsApi.markRead(String(n.id));
        } catch {
          // non-fatal; refresh poll will reconcile
        }
      }
      const link = deepLinkFor(n);
      if (link) {
        router.push(link as any);
      }
    },
    [router]
  );

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const { name: iconName, color: iconColor } = iconFor(item.type, colors);
    const unread = isUnread(item);
    const stamp = formatStamp(timeOf(item));
    const title = item.title ?? "Notification";
    const body = bodyOf(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleOpen(item)}
        style={[
          styles.row,
          {
            backgroundColor: colors.navyLight,
            borderColor: unread ? colors.teal + "55" : colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: iconColor + "22", borderColor: iconColor + "55" },
          ]}
        >
          <Feather name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowHeader}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.foreground,
                  fontFamily: unread ? "Inter_700Bold" : "Inter_600SemiBold",
                },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={[styles.stamp, { color: colors.mutedForeground }]}>
              {stamp}
            </Text>
          </View>
          {!!body && (
            <Text
              style={[styles.body, { color: colors.mutedForeground }]}
              numberOfLines={2}
            >
              {body}
            </Text>
          )}
        </View>
        {unread && (
          <View
            style={[styles.dot, { backgroundColor: colors.teal }]}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <StarryBackground />

      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.iconBtn,
            { backgroundColor: colors.navyLight, borderColor: colors.border },
          ]}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Notifications
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You’re all caught up"}
          </Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={marking}
            style={[styles.markBtn, { borderColor: colors.teal }]}
          >
            {marking ? (
              <ActivityIndicator color={colors.teal} size="small" />
            ) : (
              <Text style={[styles.markBtnText, { color: colors.teal }]}>
                Mark all read
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {!isAuthenticated ? (
        <View style={styles.empty}>
          <Feather name="bell-off" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Sign in to see notifications
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            We’ll let you know about new bids, messages, and updates to your ads.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={[styles.primaryBtn, { backgroundColor: colors.teal }]}
          >
            <Text
              style={[
                styles.primaryBtnText,
                { color: colors.isLight ? "#fff" : colors.navy },
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      ) : loading && items.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="bell" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Activity on your ads, bids, and messages will show up here.
          </Text>
          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.teal}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  markBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  markBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { fontSize: 14, flex: 1 },
  stamp: { fontSize: 11, fontFamily: "Inter_400Regular" },
  body: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginTop: 8 },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
  primaryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  primaryBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
