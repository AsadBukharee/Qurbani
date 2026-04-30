/**
 * MapPreview — lightweight OpenStreetMap tile viewer.
 *
 * Renders a 3×3 block of OSM raster tiles centered on (lat, lon), scaled
 * to fill the container, with a pin overlay sitting exactly on the
 * coordinate. Cross-platform (web / iOS / Android), no native modules,
 * no API key required.
 *
 * If lat/lon are missing, shows a friendly empty state.
 */
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface Props {
  lat: number | null | undefined;
  lon: number | null | undefined;
  /** Visual height of the preview. Default 160. */
  height?: number;
  /** Pin color. Defaults to brand gold. */
  pinColor?: string;
  /** Background while tiles load / when no coord. */
  bg?: string;
  /** Border radius applied to the outer container. Default 14. */
  radius?: number;
  /** Text shown when no coordinate is available. */
  emptyText?: string;
}

const Z = 14;
const TILE = 256;

function lonToWorldPx(lon: number, z: number) {
  return ((lon + 180) / 360) * TILE * Math.pow(2, z);
}
function latToWorldPx(lat: number, z: number) {
  const r = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) *
    TILE *
    Math.pow(2, z)
  );
}

export function MapPreview({
  lat,
  lon,
  height = 160,
  pinColor = "#C9A24C",
  bg = "#0B1E2D",
  radius = 14,
  emptyText = "Tap “Use Current Location” to drop a pin",
}: Props) {
  const [containerW, setContainerW] = React.useState(0);

  const hasCoord =
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon);

  if (!hasCoord) {
    return (
      <View
        style={[
          styles.wrap,
          styles.empty,
          { height, backgroundColor: bg, borderRadius: radius },
        ]}
      >
        <Feather name="map" size={22} color="#64748B" />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  // SAFETY: hasCoord above guarantees both are real numbers.
  const px = lonToWorldPx(lon as number, Z);
  const py = latToWorldPx(lat as number, Z);
  // Center tile (which tile contains the target point)
  const cx = Math.floor(px / TILE);
  const cy = Math.floor(py / TILE);
  // Fractional position inside the center tile
  const fx = px - cx * TILE;
  const fy = py - cy * TILE;

  // Need a width before we can size tiles
  if (containerW === 0) {
    return (
      <View
        style={[
          styles.wrap,
          { height, backgroundColor: bg, borderRadius: radius },
        ]}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      />
    );
  }

  // Render a 3×3 grid of tiles. We compute a uniform `scale` so the grid
  // covers the container in both axes (cover-fit), then translate it so
  // the target point lands exactly at the center of the visible area.
  const cols = 3;
  const rows = 3;
  const gridLogicalW = TILE * cols;
  const gridLogicalH = TILE * rows;

  // Inside the 3×3 grid, the target point is in the middle tile (offset 1,1).
  const targetGX = TILE + fx;
  const targetGY = TILE + fy;

  const scale = Math.max(
    containerW / gridLogicalW,
    height / gridLogicalH,
  );
  const offsetX = containerW / 2 - targetGX * scale;
  const offsetY = height / 2 - targetGY * scale;

  const tiles: React.ReactNode[] = [];
  for (let dy = 0; dy < rows; dy++) {
    for (let dx = 0; dx < cols; dx++) {
      const tx = cx + dx - 1;
      const ty = cy + dy - 1;
      // Guard against invalid tile coords (e.g. near the poles)
      const maxTile = Math.pow(2, Z);
      if (tx < 0 || ty < 0 || tx >= maxTile || ty >= maxTile) continue;
      tiles.push(
        <Image
          key={`${tx}_${ty}`}
          source={{
            uri: `https://tile.openstreetmap.org/${Z}/${tx}/${ty}.png`,
          }}
          style={{
            position: "absolute",
            left: dx * TILE * scale + offsetX,
            top: dy * TILE * scale + offsetY,
            width: TILE * scale,
            height: TILE * scale,
          }}
        />,
      );
    }
  }

  return (
    <View
      style={[
        styles.wrap,
        { height, backgroundColor: bg, borderRadius: radius },
      ]}
      onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
    >
      {tiles}
      {/* Pin: bottom-center of the icon sits on the target coord. */}
      <View
        style={{
          position: "absolute",
          left: containerW / 2 - 14,
          top: height / 2 - 28,
        }}
        pointerEvents="none"
      >
        <Feather name="map-pin" size={28} color={pinColor} />
      </View>
      {/* Tiny attribution chip — required by OSM tile policy. */}
      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionText}>© OpenStreetMap</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.25)",
    borderStyle: "dashed",
  },
  emptyText: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  attribution: {
    position: "absolute",
    right: 6,
    bottom: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Inter_500Medium",
  },
});
