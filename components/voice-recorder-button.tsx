import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet } from "react-native";

import type { PendingAttachment } from "@/shared/chat-types";

export function VoiceRecorderButton({ disabled, onRecorded }: { disabled?: boolean; onRecorded: (attachment: PendingAttachment) => Promise<void> | void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [submitting, setSubmitting] = useState(false);
  const toggle = async () => {
    try {
      if (state.isRecording) {
        await recorder.stop();
        if (!recorder.uri) throw new Error("The voice message could not be saved.");
        setSubmitting(true);
        await onRecorded({ uri: recorder.uri, name: `voice-${Date.now()}.m4a`, mimeType: "audio/m4a", size: 1, kind: "audio", durationMs: Math.max(1000, state.durationMillis ?? 1000) });
        setSubmitting(false);
        return;
      }
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return Alert.alert("Microphone unavailable", "Allow microphone access to record a voice message.");
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      setSubmitting(false);
      Alert.alert("Voice message unavailable", error instanceof Error ? error.message : "Please try again.");
    }
  };
  return <Pressable accessibilityLabel={state.isRecording ? "Stop voice recording" : "Record voice message"} disabled={disabled || submitting} onPress={() => void toggle()} style={({ pressed }) => [styles.button, state.isRecording && styles.recording, (disabled || submitting) && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator color="#3858E9" size="small" /> : <MaterialIcons name={state.isRecording ? "stop" : "mic-none"} color={state.isRecording ? "#FFFFFF" : "#3858E9"} size={22} />}</Pressable>;
}
const styles = StyleSheet.create({ button: { alignItems: "center", backgroundColor: "#E8EDFF", borderRadius: 19, height: 38, justifyContent: "center", width: 38 }, recording: { backgroundColor: "#D74343" }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.75 } });
