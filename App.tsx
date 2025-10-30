import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, LogBox, Pressable, StyleSheet, Text, View,Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import PTTButton from './src/components/PTTButton';
import ListeningOverlay from './src/components/ListeningOverlay';
import ClarificationBanner from './src/components/ClarificationBanner';
import ErrorBanner from './src/components/ErrorBanner';
import TranscriptList from './src/components/TranscriptList';
import { useVoiceFlow } from './src/hooks/useVoiceFlow';
import type { AppState, Scenario } from './src/types';

export default function App() {
  const { state, transcripts, onPressIn, onPressOut, onCancel, onStop, scenario, setScenario } = useVoiceFlow();

  // elapsed handled inside overlay to ensure it ticks while listening

  useEffect(() => {
    // Suppress Expo AV deprecation warning in debugger while we keep functionality stable
    LogBox.ignoreLogs([
      '[expo-av]: Expo AV has been deprecated',
    ]);
  }, []);

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerAvatar}><Image  source={require('./assets/icon.png')} resizeMode='contain' style={{ width: 32, height: 32, borderRadius: 8 }} /></View>
        <View>
          <Text style={styles.headerTitle}>VoiceFlow</Text>
          <Text style={styles.headerSubtitle}>Assistant • Online</Text>
        </View>
      </View>

      <View style={styles.devBar}>
        <Text style={styles.devLabel}>Scenario:</Text>
        {(['success','clarify','networkError','serverError'] as Scenario[]).map((s) => (
          <Pressable key={s} onPress={() => setScenario(s)} style={[styles.scenarioBtn, scenario === s && styles.scenarioBtnActive]}>
            <Text style={[styles.scenarioText, scenario === s && styles.scenarioTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.content}>
        {state.kind === 'Clarification' && (
          <ClarificationBanner prompt={state.prompt} />
        )}
        {state.kind === 'Error' && (
          <ErrorBanner message={state.message} />
        )}
        <View style={{ flex: 1 }}>
          <TranscriptList items={transcripts} />
        </View>
      </View>

      <View style={styles.footer}>
        {state.kind === 'Processing' && (
          <View style={styles.processing}>
            <ActivityIndicator />
            <Text style={{ marginLeft: 8 }}>Processing…</Text>
          </View>
        )}
        <PTTButton onPressStart={onPressIn} disabled={state.kind === 'Processing'} />
      </View>

      {state.kind === 'Listening' && (
        <ListeningOverlay onCancel={onCancel} onStop={onStop} startedAtMs={state.startedAtMs} />
      )}
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: 'white', fontWeight: '800' },
  headerTitle: { fontWeight: '800', color: '#0f172a' },
  headerSubtitle: { color: '#64748b', fontSize: 12 },
  devBar: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  devLabel: { fontWeight: '700', color: '#334155' },
  scenarioBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: '#e2e8f0' },
  scenarioBtnActive: { backgroundColor: '#1d4ed8' },
  scenarioText: { color: '#0f172a', fontSize: 12, textTransform: 'capitalize' },
  scenarioTextActive: { color: 'white' },
  content: { flex: 1, paddingTop: 8, gap: 12 },
  footer: { padding: 16, alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb', backgroundColor: '#ffffff' },
  processing: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
});
