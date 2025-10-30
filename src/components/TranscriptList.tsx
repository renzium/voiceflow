import React from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import ClarificationBanner from "./ClarificationBanner";

export type TranscriptItem = { id: string; text: string; role: "assistant" | "user" | "clarification" };

export default function TranscriptList({ items }: { items: TranscriptItem[] }) {
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => {
        if (item.role === 'clarification') {
          return (
            <View style={[styles.row, styles.left, { paddingRight: 16 }]}> 
              <View style={styles.avatar}>
                <Image source={require('../../assets/icon.png')} style={styles.avatarImg} resizeMode="cover" />
              </View>
              <View style={{ flex: 1 }}>
                <ClarificationBanner prompt={item.text} />
              </View>
            </View>
          );
        }

        return (
          <View style={[styles.row, item.role === 'assistant' ? styles.left : styles.right]}>
            {item.role === 'assistant' && (
              <View style={styles.avatar}>
                <Image source={require('../../assets/icon.png')} style={styles.avatarImg} resizeMode="cover" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                item.role === 'assistant' ? styles.bubbleAssist : styles.bubbleUser,
                item.role === 'assistant' ? styles.bubbleAssistAlign : styles.bubbleUserAlign,
              ]}
            >
              <Text style={[styles.text, item.role === 'assistant' ? styles.textAssist : styles.textUser]}>{item.text}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12, gap: 10 },
  row: { flexDirection: 'row', paddingHorizontal: 16, alignItems: 'flex-end' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarImg: { width: 28, height: 28, borderRadius: 6 },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleAssist: { backgroundColor: '#f1f5f9', borderTopLeftRadius: 6 },
  bubbleUser: { backgroundColor: '#1d4ed8', borderTopRightRadius: 6 },
  bubbleAssistAlign: { alignSelf: 'flex-start' },
  bubbleUserAlign: { alignSelf: 'flex-end' },
  text: { fontSize: 15, lineHeight: 20 },
  textAssist: { color: '#0f172a' },
  textUser: { color: 'white' },
});


