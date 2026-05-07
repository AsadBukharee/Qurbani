/**
 * Public Seller Profile Screen — app/seller/[id].tsx
 * Accessible from animal detail (tap seller name) and chat inbox.
 * No authentication required to view.
 */
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { sellers, reviews, chat, ApiSellerProfile, ApiSellerReview, ApiAnimal } from "@/lib/api";
import { useApp } from "@/contexts/AppContext";

function StarBar({ value, max = 5 }: { value: number; max?: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <Feather
          key={i}
          name="star"
          size={14}
          color={i < Math.round(value) ? colors.gold : colors.border}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review, isSellerView, onRespond }: {
  review: ApiSellerReview;
  isSellerView: boolean;
  onRespond: (r: ApiSellerReview) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.reviewCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
      <View style={styles.reviewHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.navyMid }]}>
          {review.buyer_avatar
            ? <Image source={{ uri: review.buyer_avatar }} style={styles.avatarImg} />
            : <Feather name="user" size={16} color={colors.mutedForeground} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.reviewerName, { color: colors.foreground }]}>{review.buyer_name}</Text>
          <StarBar value={review.rating} />
        </View>
        <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
          {new Date(review.created_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
        </Text>
      </View>

      {review.comment ? (
        <Text style={[styles.reviewComment, { color: colors.foreground }]}>{review.comment}</Text>
      ) : null}

      {review.seller_response ? (
        <View style={[styles.sellerResponse, { backgroundColor: colors.navyMid, borderColor: colors.teal + "44" }]}>
          <Text style={[styles.sellerResponseLabel, { color: colors.teal }]}>Seller's response</Text>
          <Text style={[styles.sellerResponseText, { color: colors.foreground }]}>{review.seller_response}</Text>
        </View>
      ) : isSellerView ? (
        <TouchableOpacity onPress={() => onRespond(review)} style={[styles.respondBtn, { borderColor: colors.teal + "60" }]}>
          <Feather name="corner-down-right" size={14} color={colors.teal} />
          <Text style={[styles.respondBtnText, { color: colors.teal }]}>Respond to review</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function AnimalCard({ animal, onPress }: { animal: ApiAnimal; onPress: () => void }) {
  const colors = useColors();
  const cover = animal.cover_image || animal.images?.[0];
  return (
    <TouchableOpacity onPress={onPress} style={[styles.animalCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
      <View style={[styles.animalImg, { backgroundColor: colors.navyMid }]}>
        {cover
          ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <Feather name="camera-off" size={20} color={colors.mutedForeground} />
        }
      </View>
      <Text style={[styles.animalTitle, { color: colors.foreground }]} numberOfLines={1}>{animal.title}</Text>
      <Text style={[styles.animalPrice, { color: colors.teal }]}>
        Rs. {Number(animal.price).toLocaleString("en-PK")}
      </Text>
      <Text style={[styles.animalCity, { color: colors.mutedForeground }]} numberOfLines={1}>{animal.city}</Text>
    </TouchableOpacity>
  );
}

export default function SellerProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, platformConfig } = useApp();

  const [profile, setProfile] = useState<ApiSellerProfile | null>(null);
  const [reviewData, setReviewData] = useState<{ summary: ApiSellerProfile["rating"]; results: ApiSellerReview[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const isOwnProfile = user?.id === id;
  const isSellerView = isOwnProfile;

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await sellers.getProfile(id);
      setProfile(data);
    } catch {
      Alert.alert("Error", "Could not load seller profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    try {
      const data = await reviews.listForSeller(id);
      setReviewData(data);
    } catch {
      // non-fatal
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    loadReviews();
  }, [load, loadReviews]);

  const handleChat = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to chat with this seller.");
      return;
    }
    if (!id) return;
    setChatLoading(true);
    try {
      const room = await chat.open(id);
      router.push(`/chat/${room.id}`);
    } catch {
      Alert.alert("Error", "Could not open chat.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleRespond = (review: ApiSellerReview) => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Respond to Review",
        "Your response will be visible publicly.",
        async (text) => {
          if (!text?.trim()) return;
          try {
            const updated = await reviews.respond(review.id, text.trim());
            setReviewData((prev) =>
              prev
                ? { ...prev, results: prev.results.map((r) => r.id === updated.id ? updated : r) }
                : prev
            );
          } catch {
            Alert.alert("Error", "Could not save response.");
          }
        },
        "plain-text",
        "",
      );
    } else {
      // Android fallback: prompt is not supported, so we'd normally use a custom modal.
      // For now, let's just use a simple Alert with one-liner (limited) or just keep it as is.
      Alert.alert("Notice", "Response feature is currently optimized for iOS. Android update coming soon.");
    }
  };

  const submitReview = async () => {
    if (!id) return;
    if (!user) {
      Alert.alert("Sign in required", "Please sign in to leave a review.");
      return;
    }
    setSubmittingReview(true);
    try {
      const newReview = await reviews.create({
        seller_id: id,
        rating: userRating,
        comment: userComment.trim(),
      });
      setReviewData((prev) =>
        prev
          ? { ...prev, results: [newReview, ...prev.results.filter(r => r.buyer_id !== user.id)] }
          : null
      );
      setReviewFormOpen(false);
      setUserComment("");
      Alert.alert("Success", "Your review has been posted.");
      loadReviews(); // Refresh summary
    } catch (err) {
      Alert.alert("Error", "Could not post review. Have you already reviewed this seller?");
    } finally {
      setSubmittingReview(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.navy, paddingTop: topPad }]}>
        <ActivityIndicator color={colors.teal} size="large" />
      </View>
    );
  }

  if (!profile) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.navy }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Seller Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {/* Seller Card */}
        <View style={[styles.sellerCard, { backgroundColor: colors.navyLight, borderColor: colors.border }]}>
          {/* Avatar */}
          <View style={[styles.bigAvatar, { backgroundColor: colors.navyMid }]}>
            {profile.avatar
              ? <Image source={{ uri: profile.avatar }} style={StyleSheet.absoluteFill} resizeMode="cover" borderRadius={40} />
              : <Feather name="user" size={32} color={colors.mutedForeground} />
            }
          </View>

          {/* Name + Verified */}
          <View style={styles.sellerMeta}>
            <Text style={[styles.sellerName, { color: colors.foreground }]}>{profile.name}</Text>
            {profile.is_verified && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.teal + "22", borderColor: colors.teal + "44" }]}>
                <Feather name="check-circle" size={13} color={colors.teal} />
                <Text style={[styles.verifiedText, { color: colors.teal }]}>Verified Seller</Text>
              </View>
            )}
            <Text style={[styles.sellerRole, { color: colors.mutedForeground }]}>
              Member since {new Date(profile.date_joined).getFullYear()}
            </Text>
          </View>

          {/* Rating */}
          {reviewData && reviewData.summary.total > 0 && (
            <View style={[styles.ratingRow, { borderTopColor: colors.border }]}>
              <View style={styles.ratingBig}>
                <Text style={[styles.ratingNum, { color: colors.gold }]}>{reviewData.summary.average.toFixed(1)}</Text>
                <StarBar value={reviewData.summary.average} />
                <Text style={[styles.ratingCount, { color: colors.mutedForeground }]}>
                  {reviewData.summary.total} review{reviewData.summary.total !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>
          )}

          {/* Chat button */}
          {!isOwnProfile && (
            <TouchableOpacity
              onPress={handleChat}
              disabled={chatLoading}
              style={[styles.chatBtn, { backgroundColor: colors.teal }]}
            >
              {chatLoading
                ? <ActivityIndicator color={colors.navy} size="small" />
                : <>
                    <Feather name="message-square" size={16} color={colors.navy} />
                    <Text style={[styles.chatBtnText, { color: colors.navy }]}>Chat with Seller</Text>
                  </>
              }
            </TouchableOpacity>
          )}

          {/* Apply for verification */}
          {isOwnProfile && !profile.is_verified && (
            <TouchableOpacity
              onPress={() => {
                const num = (platformConfig as any)?.whatsapp_number?.replace(/[^0-9]/g, "") ?? "923417070873";
                const msg = encodeURIComponent(`Hi, I am ${profile.name}. I would like to apply for seller verification.`);
                Linking.openURL(`https://wa.me/${num}?text=${msg}`);
              }}
              style={[styles.verifyApplyBtn, { borderColor: colors.teal + "60" }]}
            >
              <Feather name="shield" size={15} color={colors.teal} />
              <Text style={[styles.verifyApplyText, { color: colors.teal }]}>Apply for Verification</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Listings */}
        {profile.listings.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Listings ({profile.listings.length})
            </Text>
            <FlatList
              data={profile.listings}
              keyExtractor={(a) => a.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
              renderItem={({ item }) => (
                <AnimalCard
                  animal={item}
                  onPress={() => router.push(`/animal/${item.id}`)}
                />
              )}
            />
          </View>
        )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Ratings & Reviews
              {reviewData ? ` (${reviewData.summary.total})` : ""}
            </Text>
            {!isOwnProfile && user && !reviewFormOpen && (
              <TouchableOpacity onPress={() => setReviewFormOpen(true)}>
                <Text style={{ color: colors.teal, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>

          {reviewFormOpen && (
            <View style={[styles.reviewForm, { backgroundColor: colors.navyLight, borderColor: colors.teal + "44" }]}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>How was your experience?</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setUserRating(s)}>
                    <Feather
                      name="star"
                      size={28}
                      color={s <= userRating ? colors.gold : colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.commentInputBox, { backgroundColor: colors.navyMid, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.commentInput, { color: colors.foreground }]}
                  placeholder="Share your feedback..."
                  placeholderTextColor={colors.mutedForeground}
                  value={userComment}
                  onChangeText={setUserComment}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={styles.formActions}>
                <TouchableOpacity onPress={() => setReviewFormOpen(false)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitReview}
                  disabled={submittingReview}
                  style={[styles.submitBtn, { backgroundColor: colors.teal }]}
                >
                  {submittingReview ? (
                    <ActivityIndicator color={colors.navy} size="small" />
                  ) : (
                    <Text style={[styles.submitText, { color: colors.navy }]}>Post Review</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
          {reviewsLoading ? (
            <ActivityIndicator color={colors.teal} style={{ marginVertical: 16 }} />
          ) : reviewData && reviewData.results.length > 0 ? (
            reviewData.results.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                isSellerView={isSellerView}
                onRespond={handleRespond}
              />
            ))
          ) : (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Feather name="star" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No reviews yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  content: { padding: 16, gap: 20 },

  // Seller card
  sellerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  bigAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sellerMeta: { alignItems: "center", gap: 4 },
  sellerName: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  sellerRole: { fontSize: 13, fontFamily: "Inter_400Regular" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  verifiedText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  ratingRow: { width: "100%", paddingTop: 12, borderTopWidth: 1, alignItems: "center" },
  ratingBig: { alignItems: "center", gap: 4 },
  ratingNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  ratingCount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
  },
  chatBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  verifyApplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  verifyApplyText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Section
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },

  // Animal card
  animalCard: {
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 8,
    gap: 4,
  },
  animalImg: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
  },
  animalTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  animalPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  animalCity: { fontSize: 11, fontFamily: "Inter_400Regular" },

  // Review card
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  reviewerName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  reviewDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  reviewComment: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  sellerResponse: {
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
    gap: 4,
  },
  sellerResponseLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sellerResponseText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  respondBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  respondBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Empty
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  // Review Form
  reviewForm: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    marginBottom: 8,
  },
  formTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  starRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  commentInputBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
  },
  commentInput: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlignVertical: "top",
  },
  formActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 120,
    alignItems: "center",
  },
  submitText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
