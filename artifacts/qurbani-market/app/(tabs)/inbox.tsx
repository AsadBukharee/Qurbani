import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarryBackground } from "@/components/StarryBackground";
import { useColors } from "@/hooks/useColors";

const DUMMY_CHATS = [
  {
    id: "1",
    name: "Ahmed Raza",
    avatar: "AR",
    lastMessage: "Is the price negotiable for the Beetal Bakra?",
    time: "10:24 AM",
    unread: 2,
  },
  {
    id: "2",
    name: "Kamran Farm",
    avatar: "KF",
    lastMessage: "Location sent. You can visit tomorrow.",
    time: "Yesterday",
    unread: 0,
  },
  {
    id: "3",
    name: "Saad Ali",
    avatar: "SA",
    lastMessage: "Thanks for the deal!",
    time: "Tue",
    unread: 0,
  },
];

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
        <View style={[styles.searchBar, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
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

      <FlatList
        data={DUMMY_CHATS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.chatRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.teal + "22", borderColor: colors.teal }]}>
              <Text style={[styles.avatarText, { color: colors.teal }]}>{item.avatar}</Text>
            </View>
            <View style={styles.chatContent}>
              <View style={styles.chatTop}>
                <Text style={[styles.chatName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.chatTime, { color: item.unread > 0 ? colors.teal : colors.mutedForeground }]}>{item.time}</Text>
              </View>
              <View style={styles.chatBottom}>
                <Text style={[styles.chatLast, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
                {item.unread > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.teal }]}>
                    <Text style={[styles.unreadText, { color: colors.navy }]}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
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
  },
  chatName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "Inter_400Regular",
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
});
