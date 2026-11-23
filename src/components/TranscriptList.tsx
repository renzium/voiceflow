import React, { useEffect, useRef } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import type { TranscriptItem } from "../types";
import ClarificationBanner from "./ClarificationBanner";

const avatar = require("../../assets/icon.png");

export default function TranscriptList({ items, footer }: { items: TranscriptItem[]; footer?: React.ReactElement | null }) {
  const listRef = useRef<FlatList<TranscriptItem>>(null);
  useEffect(() => {
    if (items.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, [items.length]);

  return (
    <FlatList
      ref={listRef}
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.container}
      ListFooterComponent={footer}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Hands-free lists</Text>
          <Text style={styles.emptyText}>Tap the mic and talk naturally: “add eggs, bread and coffee”, “take bread off”, or “what’s on my list?”</Text>
        </View>
      }
      renderItem={({ item }) => {
        if (item.role === "user") {
          return (
            <View style={[styles.row, styles.right]}>
              <View style={[styles.bubble, styles.bubbleUser]}>
                <Text style={[styles.text, styles.textUser]}>{item.text}</Text>
              </View>
            </View>
          );
        }
        return (
          <View style={[styles.row, styles.left]}>
            <Image source={avatar} style={styles.avatar} />
            {item.role === "clarification" ? (
              <View style={{ flex: 1, maxWidth: "85%" }}>
                <ClarificationBanner prompt={item.text} />
              </View>
            ) : (
              <View style={[styles.bubble, styles.bubbleAssist]}>
                <Text style={[styles.text, styles.textAssist]}>{item.text}</Text>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12, gap: 10, flexGrow: 1 },
  row: { flexDirection: "row", paddingHorizontal: 16, alignItems: "flex-end" },
  left: { justifyContent: "flex-start" },
  right: { justifyContent: "flex-end" },
  avatar: { width: 28, height: 28, borderRadius: 8, marginRight: 8 },
  bubble: { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleAssist: { backgroundColor: colors.surface, borderTopLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  bubbleUser: { backgroundColor: colors.primary, borderTopRightRadius: 6 },
  text: { fontSize: 15, lineHeight: 21 },
  textAssist: { color: colors.text },
  textUser: { color: "#fff" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  emptyText: { color: colors.muted, textAlign: "center", lineHeight: 20 },
});
