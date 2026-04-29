/**
 * MediaUploader — grid-based media picker for the Create-Ad wizard.
 *
 * Features
 *  - Up to N (default 5) mixed media items (images + videos).
 *  - Each upload runs independently; an in-progress tile shows a spinner
 *    over its local preview, while completed tiles show the remote thumb.
 *  - The "Add Media" placeholder stays visible until N items are reached.
 *  - Three-dot menu on each tile → "Make Cover" / "Remove".
 *  - Cover tile is highlighted with an eye badge.
 *  - Tap a tile → full-screen swipeable preview gallery.
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export type MediaKind = "image" | "video";
export type MediaStatus = "uploading" | "done" | "error";

export interface MediaItem {
  id: string;
  /** Local `file://` URI while uploading; remote URL once `status === "done"`. */
  uri: string;
  type: MediaKind;
  status: MediaStatus;
  publicId?: string;
}

interface MediaUploaderProps {
  value: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  coverIndex: number;
  onCoverChange: (index: number) => void;
  /** Async uploader provided by the parent. Must return the remote URL. */
  uploadFn: (file: {
    uri: string;
    name: string;
    type: string;
  }) => Promise<{ url: string; publicId?: string }>;
  max?: number;
}

const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const guessMime = (uri: string, kind: MediaKind): string => {
  const m = /\.(\w+)$/.exec(uri);
  const ext = (m?.[1] ?? (kind === "video" ? "mp4" : "jpg")).toLowerCase();
  return kind === "video" ? `video/${ext}` : `image/${ext}`;
};

export function MediaUploader({
  value,
  onChange,
  coverIndex,
  onCoverChange,
  uploadFn,
  max = 5,
}: MediaUploaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // We hold the "live" list in a ref so async upload callbacks always work
  // against the latest array (avoids stale-closure overwrites when the user
  // queues several uploads back-to-back).
  const liveRef = useRef<MediaItem[]>(value);
  liveRef.current = value;

  const tileSize = (SCREEN_WIDTH - 40 - 12) / 2; // 2 cols, 12 gap

  const remainingSlots = max - value.length;

  const addPlaceholderItem = (
    item: Omit<MediaItem, "status"> & { status?: MediaStatus }
  ): MediaItem => {
    const next: MediaItem = { status: "uploading", ...item };
    onChange([...liveRef.current, next]);
    return next;
  };

  const updateItem = (id: string, patch: Partial<MediaItem>) => {
    onChange(
      liveRef.current.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  const removeItemById = (id: string) => {
    const idx = liveRef.current.findIndex((m) => m.id === id);
    if (idx < 0) return;
    const next = liveRef.current.filter((m) => m.id !== id);
    onChange(next);
    // Re-sync cover index if necessary.
    if (idx === coverIndex) onCoverChange(0);
    else if (idx < coverIndex) onCoverChange(coverIndex - 1);
  };

  const startUpload = async (item: MediaItem) => {
    try {
      const filename = item.uri.split("/").pop() || `media.${item.type === "video" ? "mp4" : "jpg"}`;
      const res = await uploadFn({
        uri: item.uri,
        name: filename,
        type: guessMime(item.uri, item.type),
      });
      updateItem(item.id, {
        uri: res.url,
        publicId: res.publicId,
        status: "done",
      });
    } catch (err: any) {
      updateItem(item.id, { status: "error" });
      Alert.alert(
        "Upload Failed",
        err?.message ?? "Could not upload this media. Tap the tile to retry."
      );
    }
  };

  const queueLocal = (
    assets: ImagePicker.ImagePickerAsset[]
  ) => {
    for (const asset of assets) {
      if (liveRef.current.length >= max) break;
      const kind: MediaKind = asset.type === "video" ? "video" : "image";
      const item = addPlaceholderItem({
        id: newId(),
        uri: asset.uri,
        type: kind,
      });
      // Fire-and-forget — each upload is independent, so the placeholder
      // remains visible the whole time.
      void startUpload(item);
    }
  };

  const pickFromLibrary = async () => {
    setSourceSheetOpen(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your media library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: remainingSlots > 1,
      selectionLimit: Math.max(remainingSlots, 1),
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (!result.canceled) queueLocal(result.assets);
  };

  const takePhoto = async () => {
    setSourceSheetOpen(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) queueLocal(result.assets);
  };

  const recordVideo = async () => {
    setSourceSheetOpen(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 0.7,
    });
    if (!result.canceled) queueLocal(result.assets);
  };

  const handleAddTap = () => {
    if (value.length >= max) return;
    setSourceSheetOpen(true);
  };

  const menuItem = useMemo(
    () => value.find((m) => m.id === menuFor) ?? null,
    [menuFor, value]
  );
  const menuItemIndex = useMemo(
    () => value.findIndex((m) => m.id === menuFor),
    [menuFor, value]
  );

  return (
    <View>
      <View style={styles.grid}>
        {value.map((item, idx) => {
          const isCover = idx === coverIndex;
          const isUploading = item.status === "uploading";
          const isError = item.status === "error";
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                if (item.status === "done") setPreviewIndex(idx);
              }}
              style={[
                styles.tile,
                {
                  width: tileSize,
                  height: tileSize,
                  borderColor: isCover
                    ? colors.teal
                    : isError
                    ? colors.destructive
                    : colors.border,
                  backgroundColor: colors.navyLight,
                },
              ]}
            >
              {item.type === "image" ? (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.tileMedia}
                  contentFit="cover"
                  transition={150}
                />
              ) : (
                <View style={styles.tileMedia}>
                  <View style={[styles.videoThumb, { backgroundColor: colors.navy }]}>
                    <Feather name="video" size={28} color={colors.teal} />
                    <Text style={[styles.videoThumbLabel, { color: colors.mutedForeground }]}>
                      Video
                    </Text>
                  </View>
                  <View style={styles.playOverlay}>
                    <View style={styles.playCircle}>
                      <Feather name="play" size={16} color="#fff" />
                    </View>
                  </View>
                </View>
              )}

              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={colors.teal} />
                  <Text style={styles.uploadingText}>Uploading…</Text>
                </View>
              )}

              {isError && (
                <View style={styles.uploadingOverlay}>
                  <Feather name="alert-triangle" size={20} color={colors.destructive} />
                  <Text style={[styles.uploadingText, { color: colors.destructive }]}>
                    Failed
                  </Text>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      updateItem(item.id, { status: "uploading" });
                      void startUpload({ ...item, status: "uploading" });
                    }}
                    style={[styles.retryBtn, { backgroundColor: colors.teal }]}
                  >
                    <Text style={[styles.retryBtnText, { color: colors.navy }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Cover badge (eye icon) */}
              {isCover && item.status === "done" && (
                <View style={[styles.coverBadge, { backgroundColor: colors.teal }]}>
                  <Feather name="eye" size={11} color={colors.navy} />
                  <Text style={[styles.coverBadgeText, { color: colors.navy }]}>
                    COVER
                  </Text>
                </View>
              )}

              {/* 3-dot menu trigger */}
              {item.status !== "uploading" && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setMenuFor(item.id);
                  }}
                  hitSlop={8}
                  style={[styles.menuBtn, { backgroundColor: "rgba(0,0,0,0.55)" }]}
                >
                  <Feather name="more-vertical" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </Pressable>
          );
        })}

        {value.length < max && (
          <TouchableOpacity
            onPress={handleAddTap}
            style={[
              styles.tile,
              styles.addTile,
              {
                width: tileSize,
                height: tileSize,
                backgroundColor: colors.navyLight,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="plus" size={28} color={colors.teal} />
            <Text style={[styles.addText, { color: colors.foreground }]}>
              Add Media
            </Text>
            <Text style={[styles.addSubText, { color: colors.mutedForeground }]}>
              {value.length}/{max}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Source action sheet */}
      <Modal
        visible={sourceSheetOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSourceSheetOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSourceSheetOpen(false)}>
          <View style={styles.sheetBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.sheet,
                  {
                    backgroundColor: colors.navyLight,
                    borderColor: colors.border,
                    paddingBottom: insets.bottom + 16,
                  },
                ]}
              >
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Add Media
                </Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                  {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left of {max}
                </Text>

                <SourceRow
                  icon="image"
                  label="Photo Library"
                  sub="Pick photos or videos"
                  onPress={pickFromLibrary}
                  colors={colors}
                />
                <SourceRow
                  icon="camera"
                  label="Take Photo"
                  sub="Use the camera"
                  onPress={takePhoto}
                  colors={colors}
                />
                <SourceRow
                  icon="video"
                  label="Record Video"
                  sub="Up to 60 seconds"
                  onPress={recordVideo}
                  colors={colors}
                />

                <TouchableOpacity
                  onPress={() => setSourceSheetOpen(false)}
                  style={[
                    styles.sheetCancel,
                    { borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.sheetCancelText, { color: colors.foreground }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Per-item 3-dot menu */}
      <Modal
        visible={!!menuFor}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuFor(null)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuFor(null)}>
          <View style={styles.menuBackdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.menu,
                  {
                    backgroundColor: colors.navyLight,
                    borderColor: colors.border,
                    paddingBottom: insets.bottom + 12,
                  },
                ]}
              >
                {menuItem && menuItem.status === "done" && menuItemIndex !== coverIndex && (
                  <MenuRow
                    icon="eye"
                    label="Make Cover"
                    onPress={() => {
                      onCoverChange(menuItemIndex);
                      setMenuFor(null);
                    }}
                    colors={colors}
                  />
                )}
                {menuItem && menuItem.status === "done" && (
                  <MenuRow
                    icon="maximize-2"
                    label="Preview"
                    onPress={() => {
                      setPreviewIndex(menuItemIndex);
                      setMenuFor(null);
                    }}
                    colors={colors}
                  />
                )}
                <MenuRow
                  icon="trash-2"
                  label="Remove"
                  destructive
                  onPress={() => {
                    if (menuFor) removeItemById(menuFor);
                    setMenuFor(null);
                  }}
                  colors={colors}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full-screen swipeable preview */}
      {previewIndex !== null && (
        <FullscreenPreview
          items={value.filter((m) => m.status === "done")}
          startIndex={Math.min(
            previewIndex,
            value.filter((m) => m.status === "done").length - 1
          )}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </View>
  );
}

function SourceRow({
  icon,
  label,
  sub,
  onPress,
  colors,
}: {
  icon: any;
  label: string;
  sub: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.sheetRow, { backgroundColor: colors.navy + "88" }]}
    >
      <View style={[styles.sheetRowIcon, { backgroundColor: colors.teal + "22" }]}>
        <Feather name={icon} size={18} color={colors.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sheetRowLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text style={[styles.sheetRowSub, { color: colors.mutedForeground }]}>
          {sub}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function MenuRow({
  icon,
  label,
  destructive,
  onPress,
  colors,
}: {
  icon: any;
  label: string;
  destructive?: boolean;
  onPress: () => void;
  colors: any;
}) {
  const tint = destructive ? colors.destructive : colors.foreground;
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow}>
      <Feather name={icon} size={18} color={tint} />
      <Text style={[styles.menuRowLabel, { color: tint }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* -------------------------------------------------------------------------- */
/*  FullscreenPreview                                                         */
/* -------------------------------------------------------------------------- */

function FullscreenPreview({
  items,
  startIndex,
  onClose,
}: {
  items: MediaItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const listRef = useRef<FlatList<MediaItem>>(null);

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={onClose}>
      <View style={[styles.previewRoot, { backgroundColor: "#000" }]}>
        <View
          style={[
            styles.previewHeader,
            { paddingTop: (Platform.OS === "web" ? 16 : insets.top) + 8 },
          ]}
        >
          <Text style={styles.previewCounter}>
            {activeIndex + 1} / {items.length}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.previewClose}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          initialScrollIndex={startIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          keyExtractor={(it) => it.id}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(
              e.nativeEvent.contentOffset.x / SCREEN_WIDTH
            );
            setActiveIndex(idx);
          }}
          renderItem={({ item, index }) => (
            <View style={[styles.previewSlide, { width: SCREEN_WIDTH }]}>
              {item.type === "image" ? (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.previewMedia}
                  contentFit="contain"
                />
              ) : (
                <PreviewVideo uri={item.uri} active={index === activeIndex} />
              )}
            </View>
          )}
        />

        <View
          style={[
            styles.previewFooter,
            { paddingBottom: (Platform.OS === "web" ? 16 : insets.bottom) + 8 },
          ]}
        >
          <View style={styles.previewDots}>
            {items.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.previewDot,
                  {
                    backgroundColor: i === activeIndex ? colors.teal : "#ffffff44",
                    width: i === activeIndex ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function PreviewVideo({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.muted = false;
  });

  React.useEffect(() => {
    if (active) {
      try { player.play(); } catch {}
    } else {
      try { player.pause(); } catch {}
    }
  }, [active, player]);

  return (
    <View style={styles.previewMedia}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                    */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  tile: {
    borderRadius: 14,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  tileMedia: {
    width: "100%",
    height: "100%",
  },
  videoThumb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  videoThumbLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  uploadingText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  retryBtnText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  coverBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coverBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  menuBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  addSubText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  /* Source sheet */
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    padding: 16,
    gap: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 4,
  },
  sheetSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  sheetRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetRowLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sheetRowSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sheetCancel: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  sheetCancelText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  /* Per-item menu */
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  menu: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuRowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },

  /* Preview */
  previewRoot: { flex: 1 },
  previewHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  previewCounter: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  previewClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewSlide: {
    height: SCREEN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  previewMedia: {
    width: "100%",
    height: "100%",
  },
  previewFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  previewDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewDot: {
    height: 6,
    borderRadius: 3,
  },
});
