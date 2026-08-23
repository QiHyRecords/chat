import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { downloadAndShareAttachment } from "@/lib/attachment-download";
import { getDownloadUrl } from "@/lib/chat-api";
import { useColors } from "@/hooks/use-colors";
import type { MessageAttachment } from "@/shared/chat-types";
import { MediaViewer } from "@/components/media-viewer";

function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

function formatDuration(milliseconds: number) { const seconds = Math.max(0, Math.ceil(milliseconds / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }

function VoiceMessageBubble({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  const colors = useColors(); const [url, setUrl] = useState<string | null>(null); const player = useAudioPlayer(url); const status = useAudioPlayerStatus(player); const waveform = [8, 13, 19, 10, 24, 15, 28, 17, 22, 12, 18, 9, 25, 14, 20, 11];
  useEffect(() => { let active = true; void getDownloadUrl(attachment.storage_path).then((result) => { if (active && !result.error) setUrl(result.data); }); return () => { active = false; }; }, [attachment.storage_path]);
  const toggle = () => { if (!url) return; if (status.playing) player.pause(); else { if (status.duration > 0 && status.currentTime >= status.duration) player.seekTo(0); player.play(); } };
  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  return <Pressable accessibilityLabel={status.playing ? "Pause voice message" : "Play voice message"} onPress={toggle} style={[styles.voice, { backgroundColor: mine ? colors.primary : colors.elevated, borderColor: mine ? colors.primary : colors.border }]}><View style={[styles.voicePlay, { backgroundColor: mine ? colors.onPrimary + "22" : colors.accentSoft }]}><MaterialIcons color={mine ? colors.onPrimary : colors.primary} name={status.playing ? "pause" : "play-arrow"} size={23} /></View><View style={styles.voiceWave}>{waveform.map((height, index) => <View key={index} style={[styles.voiceBar, { backgroundColor: index / waveform.length <= progress ? (mine ? colors.onPrimary : colors.primary) : (mine ? colors.onPrimary + "66" : colors.border), height }]} />)}</View><Text style={[styles.voiceTime, { color: mine ? colors.onPrimary : colors.foreground }]}>{formatDuration(attachment.duration_ms ?? Math.round((status.duration || 0) * 1000))}</Text></Pressable>;
}

export function MessageAttachmentCard({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  const colors = useColors(); const [url, setUrl] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [viewerOpen, setViewerOpen] = useState(false);
  useEffect(() => { let active = true; void getDownloadUrl(attachment.storage_path).then((result) => { if (active && !result.error) setUrl(result.data); }); return () => { active = false; }; }, [attachment.storage_path]);
  const share = async () => { setLoading(true); try { await downloadAndShareAttachment(attachment.storage_path, attachment.file_name, attachment.mime_type); } finally { setLoading(false); } };
  if (attachment.kind === "audio") return <VoiceMessageBubble attachment={attachment} mine={mine} />;
  const isMedia = attachment.kind === "image" || attachment.kind === "video";
  if (isMedia && url) return <><Pressable accessibilityLabel={`View ${attachment.kind}`} delayLongPress={450} onLongPress={() => setViewerOpen(true)} onPress={() => setViewerOpen(true)} style={({ pressed }) => [styles.mediaWrap, { borderColor: mine ? colors.primary : colors.border }, pressed && styles.pressed]}>{attachment.kind === "image" ? <Image contentFit="cover" source={url} style={styles.media} /> : <View style={[styles.videoPreview, { backgroundColor: colors.accentSoft }]}><MaterialIcons color={colors.primary} name="play-circle-filled" size={40} /><Text style={[styles.videoLabel, { color: colors.primary }]}>Video</Text></View>}{loading ? <View style={styles.loading}><ActivityIndicator color={colors.onPrimary} /></View> : null}</Pressable><MediaViewer attachment={attachment} onClose={() => setViewerOpen(false)} visible={viewerOpen} /></>;
  const icon = "insert-drive-file";
  return <Pressable accessibilityLabel={`Open ${attachment.file_name}`} onPress={() => void share()} style={({ pressed }) => [styles.file, { backgroundColor: mine ? colors.primary : colors.elevated, borderColor: mine ? colors.primary : colors.border }, pressed && styles.pressed]}><View style={[styles.fileIcon, { backgroundColor: mine ? colors.onPrimary + "22" : colors.accentSoft }]}><MaterialIcons name={icon} color={mine ? colors.onPrimary : colors.primary} size={22} /></View><View style={styles.fileInfo}><Text numberOfLines={1} style={[styles.fileName, { color: mine ? colors.onPrimary : colors.foreground }]}>{attachment.file_name}</Text><Text style={[styles.fileMeta, { color: mine ? colors.onPrimary : colors.muted }]}>{formatBytes(attachment.byte_size)}</Text></View>{loading ? <ActivityIndicator color={mine ? colors.onPrimary : colors.primary} /> : <MaterialIcons name="download" color={mine ? colors.onPrimary : colors.primary} size={20} />}</Pressable>;
}

const styles = StyleSheet.create({ mediaWrap: { borderRadius: 16, borderWidth: 1, height: 184, overflow: "hidden", width: 224 }, media: { height: "100%", width: "100%" }, videoPreview: { alignItems: "center", flex: 1, gap: 5, justifyContent: "center" }, videoLabel: { fontSize: 12, fontWeight: "900" }, loading: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.36)", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 }, voice: { alignItems: "center", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 8, height: 52, paddingHorizontal: 9, width: 212 }, voicePlay: { alignItems: "center", borderRadius: 16, height: 32, justifyContent: "center", width: 32 }, voiceWave: { alignItems: "center", flex: 1, flexDirection: "row", gap: 2, height: 30 }, voiceBar: { borderRadius: 2, width: 2 }, voiceTime: { fontSize: 11, fontVariant: ["tabular-nums"], fontWeight: "900" }, file: { alignItems: "center", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, maxWidth: 260, minHeight: 64, padding: 10 }, fileIcon: { alignItems: "center", borderRadius: 10, height: 38, justifyContent: "center", width: 38 }, fileInfo: { flex: 1 }, fileName: { fontSize: 13, fontWeight: "800" }, fileMeta: { fontSize: 11, marginTop: 3 }, pressed: { opacity: 0.78 } });
