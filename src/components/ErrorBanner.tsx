import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

export default function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={20} color={colors.errorText} />
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="Dismiss error">
        <Ionicons name="close" size={18} color={colors.errorText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    padding: 12,
    borderRadius: radius.md,
  },
  message: { flex: 1, color: colors.errorText },
});
