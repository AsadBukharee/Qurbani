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
  TextInput,
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
  };
  animal?: { id: string; title: string } | null;
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

function initialsOf(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatStamp(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 86_400_000 * 2) return "Yesterday";
  if (diff < 86_400_000 * 7) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString();
}

export default function InboxScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useApp();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
      list.sort((a, b) => {
        const ta = new Date(a.updated_at || a.last_message?.created_at || 0).getTime();
        const tb = new Date(b.updated_at || b.last_message?.created_at || 0).getTime();
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
      const interval = setInterval(() => {
        if (!cancelled) load();
      }, 8000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [load])
  );

  const filtered = rooms.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (r.other_user?.name ?? "").toLowerCase().includes(q) ||
      (r.last_message?.text ?? "").toLowerCase().includes(q) ||
      (r.animal?.title ?? "").toLowerCase().includes(q)
    );
  });

  const openRoom = (roomId: string, peerName?: string) => {
    router.push({
      pathname: "/chat/[id]",
      params: { id: roomId, peer: peerName ?? "" },
    });
  };

  const renderRoom = ({ item }: { item: ChatRoomItem }) => {
    const peer = item.other_user;
    const lastText = item.last_message?.text ?? "Start the conversation";
    const isMine = item.last_message?.sender?.id === user?.id;
    const stamp = formatStamp(item.last_message?.created_at || item.updated_at);
    const unread = item.unread_count ?? 0;

    return (
      <TouchableOpacity
        onPress={() => openRoom(item.id, peer?.name)}
        activeOpacity={0.7}
        style={[styles.chatRow, { borderBottomColor: colors.border }]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.teal + "22", borderColor: colors.teal },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.teal }]}>
            {initialsOf(peer?.name)}
          </Text>
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatTop}>
            <Text
              style={[styles.chatName, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {peer?.name ?? "Unknown"}
            </Text>
            <Text
              style={[
                styles.chatTime,
                { color: unread > 0 ? colors.teal : colors.mutedForeground },
              ]}
            >
              {stamp}
            </Text>
          </View>
          <View style={styles.chatBottom}>
            <Text
              style={[
                styles.chatLast,
                {
                  color: unread > 0 ? colors.foreground : colors.mutedForeground,
                  fontFamily:
                    unread > 0 ? "Inter_600SemiBold" : "Inter_400Regular",
                },
              ]}
              numberOfLines={1}
            >
              {isMine ? "You: " : ""}
              {lastText}
            </Text>
            {unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.teal }]}>
                <Text style={[styles.unreadText, { color: colors.navy }]}>
                  {unread}
                </Text>
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
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Messages</Text>
        <TouchableOpacity style={styles.actionBtn}>
          <Feather name="edit" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.navyLight, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search messages..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
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
      ) : loading && rooms.length === 0 ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="message-circle" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {rooms.length === 0 ? "No conversations yet" : "No matches"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {rooms.length === 0
              ? "Tap “Message” on any animal listing to start chatting with the seller."
              : "Try a different search term."}
          </Text>
          {error && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: bottomPad + 80,
          }}
          renderItem={renderRoom}
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
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  chatName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  chatBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  chatLast: {
    flex: 1,
    fontSize: 14,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
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
