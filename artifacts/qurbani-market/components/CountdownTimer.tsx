import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { getTimeLeft, getUrgencyLevel, type TimeLeft } from "../utils/countdown";
import { useColors } from "../hooks/useColors";

interface CountdownTimerProps {
  endTime: string;
  size?: "small" | "large";
  onExpire?: () => void;
}

export function CountdownTimer({ endTime, size = "small", onExpire }: CountdownTimerProps) {
  const colors = useColors();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(endTime));
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const tick = () => {
      const t = getTimeLeft(endTime);
      setTimeLeft(t);
      if (t.isExpired && onExpire) onExpire();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const urgency = getUrgencyLevel(timeLeft);

  useEffect(() => {
    if (urgency === "critical" || urgency === "high") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0.7);
    }
  }, [urgency]);

  const urgencyColor = {
    low: colors.mutedForeground,
    medium: colors.teal,
    high: colors.gold,
    critical: "#FF4B6E",
  }[urgency];

  if (size === "large") {
    return (
      <View style={styles.largeContainer}>
        {timeLeft.isExpired ? (
          <Animated.Text style={[styles.largeExpired, { color: "#FF4B6E", opacity: glowAnim }]}>
            AUCTION ENDED
          </Animated.Text>
        ) : (
          <View style={styles.largeBlocks}>
            {timeLeft.days > 0 && (
              <TimeBlock value={timeLeft.days} label="DAYS" color={urgencyColor} />
            )}
            <TimeBlock value={timeLeft.hours} label="HRS" color={urgencyColor} />
            <Separator color={urgencyColor} />
            <TimeBlock value={timeLeft.minutes} label="MIN" color={urgencyColor} />
            <Separator color={urgencyColor} />
            <TimeBlock value={timeLeft.seconds} label="SEC" color={urgencyColor} />
          </View>
        )}
        {!timeLeft.isExpired && urgency === "critical" && (
          <Animated.Text style={[styles.urgencyLabel, { color: "#FF4B6E", opacity: glowAnim }]}>
            ENDING SOON!
          </Animated.Text>
        )}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.smallBadge, { backgroundColor: urgencyColor + "22", borderColor: urgencyColor + "55", opacity: urgency === "critical" ? glowAnim : 1 }]}>
      <Text style={[styles.smallText, { color: urgencyColor }]}>
        {timeLeft.isExpired
          ? "Ended"
          : (() => {
              const t = timeLeft;
              if (t.days > 0) return `${t.days}d ${t.hours}h`;
              if (t.hours > 0) return `${t.hours}h ${t.minutes}m`;
              return `${t.minutes}m ${t.seconds}s`;
            })()}
      </Text>
    </Animated.View>
  );
}

function TimeBlock({ value, label, color }: { value: number; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.timeBlock, { backgroundColor: color + "18", borderColor: color + "44" }]}>
      <Text style={[styles.timeValue, { color }]}>{String(value).padStart(2, "0")}</Text>
      <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function Separator({ color }: { color: string }) {
  return <Text style={[styles.separator, { color }]}>:</Text>;
}

const styles = StyleSheet.create({
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  largeContainer: {
    alignItems: "center",
    gap: 8,
  },
  largeBlocks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeBlock: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 56,
  },
  timeValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  timeLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  separator: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  largeExpired: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  urgencyLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
});
