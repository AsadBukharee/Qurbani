import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { apiErrorMessage, chat as chatApi, isApiEnabled } from "@/lib/api";

interface ChatRoomItem {
  id: string;
  other_user?: {
    id: string;
    name: string;
    avatar?: string | null;
    phone?: string;
  };
  animal?: { id: string; title: string; images?: string[] } | null;
  last_message?: {
    text: string;
    created_at?: string;
    sender?: { id: string };
  } | null;
  unread_count?: number;
  updated_at?: string;
}

function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.results)) return data.results as T[];
  return [];
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
  return d.toLocaleDateString();
}

export default function ChatListScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isApiEnabled() || !isAuthenticated) {
      setRooms([]);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await chatApi.rooms();
      const list = unwrap<ChatRoomItem>(data);
      // Sort by latest activity (updated_at or last_message.created_at)
      list.sort((a, b) => {
        const ta = new Date(
          a.updated_at || a.last_message?.created_at || 0
        ).getTime();
        const tb = new Date(
          b.updated_at || b.last_message?.created_at || 0
        ).getTime();
        return tb - ta;
      });
      setRooms(list);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not load conversations."));
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
      // Poll every 8s while focused
      const interval = setInterval(() => {
        if (!cancelled) load();
      }, 8000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [load])
  );

  const openRoom = (roomId: string, peerName?: string) => {
    router.push({ pathname: "/chat/[id]", params: { id: roomId, peer: peerName ?? "" } });
  };

  const renderRoom = ({ item }: { item: ChatRoomItem }) => {
    const peer = item.other_user;
    const initials = (peer?.name ?? "?")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const lastText = item.last_message?.text ?? "Start the conversation";
    const isMine = item.last_message?.sender?.id === user?.id;
    const stamp = formatStamp(
      item.last_message?.created_at || item.updated_at
    );
    const unread = item.unread_count ?? 0;

    return (
      <TouchableOpacity
        onPress={() => openRoom(item.id, peer?.name)}
        style={[
          styles.roomCard,
          { backgroundColor: colors.navyLight, borderColor: colors.border },
        ]}
      >
        {peer?.avatar ? (
          <Image source={{ uri: peer.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: colors.teal + "33", borderColor: colors.teal + "55" },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.teal }]}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.roomHeader}>
            <Text
              style={[styles.peerName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {peer?.name ?? "Unknown"}
            </Text>
            <Text style={[styles.stamp, { color: colors.mutedForeground }]}>
              {stamp}
            </Text>
          </View>
          {item.animal?.title && (
            <Text
              style={[styles.animalRef, { color: colors.gold }]}
              numberOfLines={1}
            >
              <Feather name="tag" size={10} /> {item.animal.title}
            </Text>
          )}
          <View style={styles.lastRow}>
            <Text
              style={[
                styles.lastText,
                {
                  color: unread > 0 ? colors.foreground : colors.mutedForeground,
                  fontFamily: unread > 0 ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
              numberOfLines={1}
            >
              {isMine ? "You: " : ""}
              {lastText}
            </Text>
            {unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.teal }]}>
                <Text style={styles.unreadText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
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
          <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your conversations with buyers and sellers
          </Text>
        </View>
      </View>

      {!isAuthenticated ? (
        <View style={styles.empty}>
          <Feather name="message-circle" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Sign in to chat
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Create an account to message buyers and sellers.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login")}
            style={[styles.primaryBtn, { backgroundColor: colors.teal }]}
          >
            <Text style={[styles.primaryBtnText, { color: colors.isLight ? "#fff" : colors.navy }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      ) : loading && rooms.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : rooms.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="message-circle" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No conversations yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap "Message" on any animal listing to start chatting with the seller.
          </Text>
          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(r) => r.id}
          renderItem={renderRoom}
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
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  avatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  roomHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  peerName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  stamp: { fontSize: 11, fontFamily: "Inter_400Regular" },
  animalRef: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  lastRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  lastText: { flex: 1, fontSize: 13 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
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
