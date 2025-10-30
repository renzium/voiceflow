import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type Props = { onCancel: () => void; onStop: () => void; startedAtMs: number };

export default function ListeningOverlay({ onCancel, onStop, startedAtMs }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  const elapsedSec = Math.max(0, Math.floor((now - startedAtMs) / 1000));

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.pulse, { transform: [{ scale }] }]} />
      <Text style={styles.title}>Listening…</Text>
      <Text style={styles.timer}>{elapsedSec}s</Text>
      <View style={styles.actions}>
        <Pressable onPress={onStop} accessibilityLabel="Stop recording" style={[styles.btn, styles.stop]}>
          <Text style={styles.btnText}>Stop</Text>
        </Pressable>
        <Pressable onPress={onCancel} accessibilityLabel="Cancel recording" style={[styles.btn, styles.cancel]}>
          <Text style={styles.btnText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#0f172a",
    alignItems: "center",
  },
  pulse: {
    width: 48,
    height: 48,
    backgroundColor: "#22d3ee",
    borderRadius: 999,
    marginBottom: 12,
  },
  title: { color: "white", fontSize: 18, fontWeight: "700" },
  timer: { color: "#cbd5e1", marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  btnText: { color: 'white', fontWeight: '700' },
  stop: { backgroundColor: '#22c55e' },
  cancel: { backgroundColor: '#ef4444' },
});


