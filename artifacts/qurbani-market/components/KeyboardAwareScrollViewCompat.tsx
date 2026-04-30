/**
 * Cross-platform keyboard-aware scroll view.
 *
 * Wraps content in a KeyboardAvoidingView so that focused inputs slide up
 * above the on-screen keyboard. Works on iOS, Android (Expo Go), and web
 * — no native dependency required.
 */
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from "react-native";

interface Props extends ScrollViewProps {
  /** Extra space (px) to leave between the keyboard and the focused input. */
  bottomOffset?: number;
}

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  bottomOffset = 80,
  contentContainerStyle,
  ...props
}: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={[
          { paddingBottom: bottomOffset },
          contentContainerStyle,
        ]}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
