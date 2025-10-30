import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
  label: { color: "#7f1d1d", fontWeight: "700", marginBottom: 4 },
  message: { color: "#7f1d1d" },
});


