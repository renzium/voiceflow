import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function ClarificationBanner({ prompt }: { prompt: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.accent} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Clarification needed</Text>
        <Text style={styles.prompt}>{prompt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: "#fff7ed", // orange-50
    borderColor: "#f59e0b", // orange-500
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  accent: {
    width: 4,
    height: '100%',
    backgroundColor: '#c2410c', // orange-700
    borderRadius: 2,
    marginRight: 10,
  },
  label: { color: "#9a3412", fontWeight: "800", marginBottom: 2 },
  prompt: { color: "#7c2d12" },
});


