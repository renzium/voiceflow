import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

export default function ClarificationBanner({ prompt }: { prompt: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Needs a bit more info</Text>
      <Text style={styles.prompt}>{prompt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warnBg,
    borderColor: colors.warnBorder,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderTopLeftRadius: 6,
  },
  label: { color: colors.warnText, fontWeight: "800", fontSize: 12, marginBottom: 2, textTransform: "uppercase" },
  prompt: { color: colors.warnText, fontSize: 15, lineHeight: 20 },
});
