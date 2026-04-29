import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StepperProgressProps {
  steps: string[];
  currentStep: number;
  onStepPress?: (step: number) => void;
}

export function StepperProgress({ steps, currentStep, onStepPress }: StepperProgressProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isClickable = isCompleted && onStepPress;
        const circleColor = isCompleted || isCurrent ? colors.teal : colors.navyMid;
        const borderColor = isCompleted || isCurrent ? colors.teal : colors.border;
        return (
          <React.Fragment key={idx}>
            <TouchableOpacity
              disabled={!isClickable}
              onPress={() => isClickable && onStepPress(stepNum)}
              style={styles.stepItem}
            >
              <View style={[styles.circle, { backgroundColor: circleColor, borderColor }]}>
                {isCompleted ? (
                  <Feather name="check" size={13} color={colors.navy} />
                ) : (
                  <Text style={[styles.num, { color: isCurrent ? colors.navy : colors.mutedForeground }]}>
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text style={[styles.label, { color: isCompleted || isCurrent ? colors.teal : colors.mutedForeground }]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
            {idx < steps.length - 1 && (
              <View style={[styles.line, { backgroundColor: isCompleted ? colors.teal : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4 },
  stepItem: { alignItems: "center", gap: 4 },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  num: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 9, fontFamily: "Inter_500Medium", maxWidth: 60, textAlign: "center" },
  line: { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 4, marginBottom: 16 },
});
