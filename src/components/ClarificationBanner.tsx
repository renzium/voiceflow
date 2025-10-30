import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ClarificationBanner({ prompt }: { prompt: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Clarification needed</Text>
      <Text style={styles.prompt}>{prompt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fef9c3",
    borderColor: "#fde047",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
  label: { color: "#92400e", fontWeight: "700", marginBottom: 4 },
  prompt: { color: "#92400e" },
});


