import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const COLORS = ["#D4AF37", "#2DD4BF", "#FF4B6E", "#A78BFA", "#F97316"];
const PARTICLE_COUNT = 60;
const { width: SW, height: SH } = Dimensions.get("window");

export function ConfettiOverlay({ visible }: { visible: boolean }) {
  const colors = useColors();
  const [particles] = React.useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: Math.random() * SW,
      delay: Math.random() * 1500,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 6,
    }))
  );

  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    if (!visible) return;
    setFrame(0);
    const interval = setInterval(() => setFrame((f) => f + 1), 50);
    const timeout = setTimeout(() => clearInterval(interval), 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [visible]);

  if (!visible || frame > 60) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => {
        const elapsed = frame * 50 - p.delay;
        if (elapsed < 0) return null;
        const progress = Math.min(elapsed / 2000, 1);
        const y = -20 + progress * (SH + 40);
        const wobble = Math.sin(elapsed / 200 + p.id) * 20;
        const opacity = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;
        const rotation = (elapsed / 5 + p.id * 30) % 360;
        return (
          <View
            key={p.id}
            style={{
              position: "absolute",
              left: p.x + wobble,
              top: y,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              borderRadius: 2,
              opacity,
              transform: [{ rotate: `${rotation}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}
