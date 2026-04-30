import { Feather } from "@expo/vector-icons";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { apiErrorMessage, chat as chatApi, isApiEnabled } from "@/lib/api";

interface ChatMessage {
  id: string;
  text: string;
  created_at?: string;
  sender?: { id: string; name?: string };
}

function unwrap<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.results)) return data.results as T[];
  return [];
}

function formatTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatRoomScreen() {
  const { id, peer } = useLocalSearchParams<{ id: string; peer?: string }>();
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 16 : insets.bottom;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const lastMessageId = useRef<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!isApiEnabled() || !id) return;
      try {
        if (!silent) setError(null);
        const data = await chatApi.messages(id);
        const list = unwrap<ChatMessage>(data);
        // Sort oldest -> newest
        list.sort((a, b) => {
          const ta = new Date(a.created_at ?? 0).getTime();
          const tb = new Date(b.created_at ?? 0).getTime();
          return ta - tb;
        });
        setMessages(list);

        // Auto-scroll if a new message arrived
        const newest = list[list.length - 1]?.id ?? null;
        if (newest && newest !== lastMessageId.current) {
          lastMessageId.current = newest;
          setTimeout(() => {
            listRef.current?.scrollToEnd({ animated: true });
          }, 50);
        }
      } catch (err) {
        if (!silent) setError(apiErrorMessage(err, "Could not load messages."));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  // Poll every 3s while focused
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      load();
      const interval = setInterval(() => {
        if (!cancelled) load(true);
      }, 3000);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [load])
  );

  // Initial scroll to bottom once messages first land
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !id) return;

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      text: trimmed,
      created_at: new Date().toISOString(),
      sender: { id: user?.id ?? "me", name: user?.name },
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");
    setSending(true);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 30);

    try {
      const sent = (await chatApi.send(id, trimmed)) as ChatMessage;
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId && sent?.id ? sent : m))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(trimmed);
      setError(apiErrorMessage(err, "Could not send message."));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const senderId = typeof item.sender === "object" ? item.sender?.id : item.sender;
    const isMine = senderId === user?.id || item.id.startsWith("temp-");
    return (
      <View
        style={[
          styles.bubbleRow,
          { justifyContent: isMine ? "flex-end" : "flex-start" },
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine
              ? { backgroundColor: colors.teal, borderBottomRightRadius: 4 }
              : {
                  backgroundColor: colors.navyLight,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderBottomLeftRadius: 4,
                },
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              {
                color: isMine
                  ? colors.isLight
                    ? "#fff"
                    : colors.navy
                  : colors.foreground,
              },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.bubbleTime,
              {
                color: isMine
                  ? (colors.isLight ? "#ffffffaa" : colors.navy + "99")
                  : colors.mutedForeground,
              },
            ]}
          >
            {formatTime(item.created_at)}
            {item.id.startsWith("temp-") ? " · sending…" : ""}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      <View
        style={[
          styles.topBar,
          { paddingTop: topPad + 8, borderBottomColor: colors.border },
        ]}
      >
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
          <Text
            style={[styles.peerName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {peer || "Conversation"}
          </Text>
          <Text style={[styles.peerStatus, { color: colors.mutedForeground }]}>
            Live · updates every few seconds
          </Text>
        </View>
      </View>

      {loading && messages.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.center}>
          <Feather name="message-square" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Say salaam — start the conversation.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: false })
          }
        />
      )}

      {error && (
        <Text
          style={[
            styles.errorBar,
            { color: "#fff", backgroundColor: "#c62828" },
          ]}
        >
          {error}
        </Text>
      )}

      <KeyboardAwareScrollViewCompat
        scrollEnabled={false}
        bottomOffset={Platform.OS === "ios" ? 24 : 0}
        contentContainerStyle={{}}
      >
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.navyLight,
              borderTopColor: colors.border,
              paddingBottom: bottomPad + 10,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.navyMid,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="Type a message…"
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[
              styles.sendBtn,
              {
                backgroundColor:
                  text.trim() && !sending ? colors.teal : colors.teal + "55",
              },
            ]}
          >
            <Feather
              name="send"
              size={18}
              color={colors.isLight ? "#fff" : colors.navy}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>
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
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  peerName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  peerStatus: { fontSize: 11, fontFamily: "Inter_400Regular" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  messageList: { padding: 12, gap: 6, flexGrow: 1 },
  bubbleRow: { flexDirection: "row", marginVertical: 2 },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 19 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  errorBar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
