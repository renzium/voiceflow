import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "../theme";

type Props = { startedAtMs: number; partial: string; onStop: () => void; onCancel: () => void };

export default function ListeningOverlay({ startedAtMs, partial, onStop, onCancel }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 550, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 550, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAtMs) / 1000));

  return (
    <View style={styles.sheet} accessibilityViewIsModal accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />
        <Text style={styles.title}>Listening</Text>
        <Text style={styles.timer}>{elapsed}s</Text>
      </View>
      <Text style={[styles.partial, !partial && styles.placeholder]} numberOfLines={4}>
        {partial || "Try “add eggs and bread” or “what’s on my list?”"}
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel" style={[styles.btn, styles.cancel]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable onPress={onStop} accessibilityRole="button" accessibilityLabel="Done speaking" style={[styles.btn, styles.done]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    paddingBottom: 36,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.overlay,
    gap: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.listening },
  title: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1 },
  timer: { color: "#94a3b8", fontVariant: ["tabular-nums"] },
  partial: { color: "#fff", fontSize: 22, lineHeight: 30, fontWeight: "500", minHeight: 60 },
  placeholder: { color: "#64748b", fontSize: 17 },
  actions: { flexDirection: "row", gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: radius.pill, alignItems: "center" },
  cancel: { backgroundColor: "#1e293b" },
  cancelText: { color: "#cbd5e1", fontWeight: "700" },
  done: { backgroundColor: "#fff" },
  doneText: { color: colors.text, fontWeight: "700" },
});
