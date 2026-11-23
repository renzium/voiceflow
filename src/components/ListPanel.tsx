import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

export default function ListPanel({ items }: { items: string[] }) {
  return (
    <View style={styles.card} accessibilityLabel={`Your list, ${items.length} items`}>
      <View style={styles.header}>
        <Text style={styles.title}>Your list</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{items.length}</Text>
        </View>
      </View>
      {items.length === 0 ? (
        <Text style={styles.empty}>Nothing yet. Say “add milk” to get started.</Text>
      ) : (
        <View style={styles.chips}>
          {items.map((item) => (
            <View key={item} style={styles.chip}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.primary} />
              <Text style={styles.chipText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontWeight: "700", color: colors.text, fontSize: 15 },
  badge: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  empty: { color: colors.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  chipText: { color: colors.primaryDark, fontWeight: "600" },
});
