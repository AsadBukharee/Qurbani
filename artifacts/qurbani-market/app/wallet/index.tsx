import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
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
import { useTheme } from "@/contexts/ThemeContext";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  label: string;
  sub: string;
  date: string;
  icon: string;
}

const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: "t1", type: "credit", amount: 5000, label: "Wallet Top-up", sub: "Via Easypaisa", date: "Today, 2:30 PM", icon: "plus-circle" },
  { id: "t2", type: "debit", amount: 1000, label: "Boli Listing Fee", sub: "Beetal Bakra listing", date: "Today, 11:00 AM", icon: "trending-up" },
  { id: "t3", type: "credit", amount: 47500, label: "Bid Won Payment", sub: "Sahiwal Cow – 7 Shares", date: "Yesterday, 5:15 PM", icon: "check-circle" },
  { id: "t4", type: "debit", amount: 47500, label: "Animal Purchase", sub: "Sahiwal Cow – 7 Shares", date: "Yesterday, 5:16 PM", icon: "shopping-bag" },
  { id: "t5", type: "credit", amount: 10000, label: "Wallet Top-up", sub: "Via JazzCash", date: "2 days ago", icon: "plus-circle" },
  { id: "t6", type: "debit", amount: 1000, label: "Boli Listing Fee", sub: "Rajan Puri Bakra listing", date: "3 days ago", icon: "trending-up" },
];

const TOPUP_METHODS = [
  { id: "easypaisa", label: "Easypaisa", icon: "smartphone" },
  { id: "jazzcash", label: "JazzCash", icon: "smartphone" },
  { id: "card", label: "Bank Card", icon: "credit-card" },
];

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 25000, 50000];

export default function WalletScreen() {
  const colors = useColors();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [balance] = useState(13500);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("easypaisa");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTopup = () => {
    const amt = parseInt(topupAmount, 10);
    if (isNaN(amt) || amt < 100) {
      Alert.alert("Invalid Amount", "Minimum top-up is Rs. 100.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowTopup(false);
      setTopupAmount("");
      Alert.alert("Top-up Successful", `Rs. ${amt.toLocaleString()} added to your wallet via ${selectedMethod}.`);
    }, 1500);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {theme === "dark" && <StarryBackground />}
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: bottomPad + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.pageHeader, { paddingHorizontal: 20 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.navyLight, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>My Wallet</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Balance Card */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View
            style={[
              styles.balanceCard,
              {
                backgroundColor: colors.isLight ? colors.teal : colors.navyLight,
                borderColor: colors.teal + "66",
                shadowColor: colors.teal,
              },
            ]}
          >
            <Text style={[styles.balanceLabel, { color: colors.isLight ? "#fff8" : colors.mutedForeground }]}>
              Available Balance
            </Text>
            <Text style={[styles.balanceAmount, { color: colors.isLight ? "#fff" : colors.teal }]}>
              Rs. {balance.toLocaleString()}
            </Text>
            <Text style={[styles.balanceSub, { color: colors.isLight ? "#ffffffaa" : colors.mutedForeground }]}>
              {user ? `${user.name}'s Wallet` : "Guest Wallet"}
            </Text>

            <View style={styles.balanceActions}>
              <TouchableOpacity
                onPress={() => setShowTopup(true)}
                style={[styles.balanceBtn, { backgroundColor: colors.isLight ? "#ffffff33" : colors.teal + "22", borderColor: colors.isLight ? "#ffffff55" : colors.teal + "55" }]}
              >
                <Feather name="plus" size={15} color={colors.isLight ? "#fff" : colors.teal} />
                <Text style={[styles.balanceBtnText, { color: colors.isLight ? "#fff" : colors.teal }]}>Top-up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.balanceBtn, { backgroundColor: colors.isLight ? "#ffffff33" : colors.gold + "22", borderColor: colors.isLight ? "#ffffff55" : colors.gold + "55" }]}
              >
                <Feather name="send" size={15} color={colors.isLight ? "#fff" : colors.gold} />
                <Text style={[styles.balanceBtnText, { color: colors.isLight ? "#fff" : colors.gold }]}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.balanceBtn, { backgroundColor: colors.isLight ? "#ffffff33" : colors.navyMid, borderColor: colors.isLight ? "#ffffff55" : colors.border }]}
              >
                <Feather name="download" size={15} color={colors.isLight ? "#fff" : colors.foreground} />
                <Text style={[styles.balanceBtnText, { color: colors.isLight ? "#fff" : colors.foreground }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsRow, { paddingHorizontal: 20, marginTop: 16 }]}>
          {[
            { label: "Total Spent", amount: "Rs. 49,500", icon: "arrow-up-circle", color: "#ef4444" },
            { label: "Total Received", amount: "Rs. 57,500", icon: "arrow-down-circle", color: colors.success },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.navyLight, borderColor: colors.border, shadowColor: colors.shadow }]}
            >
              <Feather name={stat.icon as any} size={20} color={stat.color} />
              <Text style={[styles.statAmount, { color: colors.foreground }]}>{stat.amount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Top-up Panel */}
        {showTopup && (
          <View style={[styles.topupPanel, { marginHorizontal: 20, marginTop: 16, backgroundColor: colors.navyLight, borderColor: colors.teal + "44" }]}>
            <View style={styles.topupHeader}>
              <Text style={[styles.topupTitle, { color: colors.foreground }]}>Add Money</Text>
              <TouchableOpacity onPress={() => setShowTopup(false)}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Enter Amount (Rs.)</Text>
            <View style={[styles.amountInput, { backgroundColor: colors.navyMid, borderColor: colors.teal + "55" }]}>
              <Text style={[styles.rupee, { color: colors.teal }]}>Rs.</Text>
              <TextInput
                style={[styles.amountField, { color: colors.teal }]}
                value={topupAmount}
                onChangeText={setTopupAmount}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setTopupAmount(amt.toString())}
                  style={[styles.quickChip, { backgroundColor: topupAmount === amt.toString() ? colors.teal + "22" : colors.navyMid, borderColor: topupAmount === amt.toString() ? colors.teal : colors.border }]}
                >
                  <Text style={[styles.quickChipText, { color: topupAmount === amt.toString() ? colors.teal : colors.foreground }]}>
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Payment Method</Text>
            {TOPUP_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                onPress={() => setSelectedMethod(method.id)}
                style={[
                  styles.methodRow,
                  {
                    backgroundColor: selectedMethod === method.id ? colors.teal + "15" : colors.navyMid,
                    borderColor: selectedMethod === method.id ? colors.teal : colors.border,
                  },
                ]}
              >
                <Feather name={method.icon as any} size={16} color={selectedMethod === method.id ? colors.teal : colors.mutedForeground} />
                <Text style={[styles.methodLabel, { color: selectedMethod === method.id ? colors.teal : colors.foreground }]}>
                  {method.label}
                </Text>
                {selectedMethod === method.id && <Feather name="check" size={14} color={colors.teal} />}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={handleTopup}
              disabled={isProcessing}
              style={[styles.topupBtn, { backgroundColor: isProcessing ? colors.teal + "88" : colors.teal }]}
            >
              <Text style={[styles.topupBtnText, { color: colors.isLight ? "#fff" : colors.navy }]}>
                {isProcessing ? "Processing..." : `Add Rs. ${parseInt(topupAmount || "0").toLocaleString()}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transaction History */}
        <View style={[styles.section, { paddingHorizontal: 20, marginTop: 20 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.teal }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.txCard, { backgroundColor: colors.navyLight, borderColor: colors.border, shadowColor: colors.shadow }]}>
            {SAMPLE_TRANSACTIONS.map((tx, index) => (
              <View
                key={tx.id}
                style={[
                  styles.txRow,
                  { borderBottomColor: colors.border },
                  index < SAMPLE_TRANSACTIONS.length - 1 && styles.txBorder,
                ]}
              >
                <View style={[styles.txIcon, { backgroundColor: tx.type === "credit" ? colors.success + "18" : "#ef444418" }]}>
                  <Feather name={tx.icon as any} size={16} color={tx.type === "credit" ? colors.success : "#ef4444"} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txLabel, { color: colors.foreground }]}>{tx.label}</Text>
                  <Text style={[styles.txSub, { color: colors.mutedForeground }]}>{tx.sub}</Text>
                  <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === "credit" ? colors.success : "#ef4444" }]}>
                  {tx.type === "credit" ? "+" : "-"}Rs. {tx.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  balanceCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    gap: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  balanceAmount: { fontSize: 36, fontFamily: "Inter_700Bold" },
  balanceSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  balanceActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  balanceBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  balanceBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  statAmount: { fontSize: 15, fontFamily: "Inter_700Bold", marginTop: 4 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  topupPanel: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  topupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topupTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  inputLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  amountInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  rupee: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  amountField: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  quickAmounts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  quickChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  quickChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  methodLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  topupBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  topupBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  section: { gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  txCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  txBorder: { borderBottomWidth: 1 },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, gap: 2 },
  txLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  txSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txDate: { fontSize: 10, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
