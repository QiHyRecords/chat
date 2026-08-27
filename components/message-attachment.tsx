import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ClayPressable } from "@/components/clay-ui";
import { MediaViewer } from "@/components/media-viewer";
import { downloadAndShareAttachment } from "@/lib/attachment-download";
import { getDownloadUrl } from "@/lib/chat-api";
import { useColors } from "@/hooks/use-colors";
import type { MessageAttachment } from "@/shared/chat-types";

function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
function formatDuration(milliseconds: number) { const seconds = Math.max(0, Math.ceil(milliseconds / 1000)); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }

function VoiceMessageBubble({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  const colors = useColors();
  const [url, setUrl] = useState<string | null>(null);
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const waveform = [8, 13, 19, 10, 24, 15, 28, 17, 22, 12, 18, 9, 25, 14, 20, 11];
  useEffect(() => { let active = true; void getDownloadUrl(attachment.storage_path).then((result) => { if (active && !result.error) setUrl(result.data); }); return () => { active = false; }; }, [attachment.storage_path]);
  const toggle = () => { if (!url) return; if (status.playing) player.pause(); else { if (status.duration > 0 && status.currentTime >= status.duration) player.seekTo(0); player.play(); } };
  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  return <ClayPressable accessibilityLabel={status.playing ? "Pause voice message" : "Play voice message"} onPress={toggle} radius={24} style={[styles.voice, { backgroundColor: mine ? colors.primary : colors.elevated }]}><View style={styles.voiceContent}><View style={[styles.voicePlay, { backgroundColor: mine ? colors.onPrimary + "22" : colors.accentSoft }]}><MaterialIcons color={mine ? colors.onPrimary : colors.primary} name={status.playing ? "pause" : "play-arrow"} size={23} /></View><View style={styles.voiceWave}>{waveform.map((height, index) => <View key={index} style={[styles.voiceBar, { backgroundColor: index / waveform.length <= progress ? (mine ? colors.onPrimary : colors.primary) : (mine ? colors.onPrimary + "66" : colors.border), height }]} />)}</View><Text style={[styles.voiceTime, { color: mine ? colors.onPrimary : colors.foreground }]}>{formatDuration(attachment.duration_ms ?? Math.round((status.duration || 0) * 1000))}</Text></View></ClayPressable>;
}

export function MessageAttachmentCard({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  const colors = useColors();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  useEffect(() => { let active = true; void getDownloadUrl(attachment.storage_path).then((result) => { if (active && !result.error) setUrl(result.data); }); return () => { active = false; }; }, [attachment.storage_path]);
  const share = async () => { setLoading(true); try { await downloadAndShareAttachment(attachment.storage_path, attachment.file_name, attachment.mime_type); } finally { setLoading(false); } };
  if (attachment.kind === "audio") return <VoiceMessageBubble attachment={attachment} mine={mine} />;
  const isMedia = attachment.kind === "image" || attachment.kind === "video";
  if (isMedia && url) return <><ClayPressable accessibilityLabel={`View ${attachment.kind}`} delayLongPress={450} onLongPress={() => setViewerOpen(true)} onPress={() => setViewerOpen(true)} radius={24} style={styles.mediaWrap}><View style={styles.mediaContent}>{attachment.kind === "image" ? <Image contentFit="cover" source={url} style={styles.media} /> : <View style={[styles.videoPreview, { backgroundColor: colors.accentSoft }]}><MaterialIcons color={colors.primary} name="play-circle-filled" size={40} /><Text style={[styles.videoLabel, { color: colors.primary }]}>Video</Text></View>}{loading ? <View style={styles.loading}><ActivityIndicator color={colors.onPrimary} /></View> : null}</View></ClayPressable><MediaViewer attachment={attachment} onClose={() => setViewerOpen(false)} visible={viewerOpen} /></>;
  return <ClayPressable accessibilityLabel={`Open ${attachment.file_name}`} onPress={() => void share()} radius={22} style={[styles.file, { backgroundColor: mine ? colors.primary : colors.elevated }]}><View style={styles.fileContent}><View style={[styles.fileIcon, { backgroundColor: mine ? colors.onPrimary + "22" : colors.accentSoft }]}><MaterialIcons name="insert-drive-file" color={mine ? colors.onPrimary : colors.primary} size={22} /></View><View style={styles.fileInfo}><Text numberOfLines={1} style={[styles.fileName, { color: mine ? colors.onPrimary : colors.foreground }]}>{attachment.file_name}</Text><Text style={[styles.fileMeta, { color: mine ? colors.onPrimary : colors.muted }]}>{formatBytes(attachment.byte_size)}</Text></View>{loading ? <ActivityIndicator color={mine ? colors.onPrimary : colors.primary} /> : <MaterialIcons name="download" color={mine ? colors.onPrimary : colors.primary} size={20} />}</View></ClayPressable>;
}

const styles = StyleSheet.create({
  mediaWrap: { height: 188, width: 228 }, mediaContent: { borderRadius: 22, flex: 1, overflow: "hidden" }, media: { height: "100%", width: "100%" }, videoPreview: { alignItems: "center", flex: 1, gap: 5, justifyContent: "center" }, videoLabel: { fontSize: 12, fontWeight: "900" }, loading: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.36)", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 }, voice: { height: 54, paddingHorizontal: 10, width: 216 }, voiceContent: { alignItems: "center", flexDirection: "row", gap: 8, height: 54 }, voicePlay: { alignItems: "center", borderRadius: 17, height: 34, justifyContent: "center", width: 34 }, voiceWave: { alignItems: "center", flex: 1, flexDirection: "row", gap: 2, height: 30 }, voiceBar: { borderRadius: 3, width: 2 }, voiceTime: { fontSize: 11, fontVariant: ["tabular-nums"], fontWeight: "900" }, file: { maxWidth: 264, minHeight: 68, padding: 11 }, fileContent: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 46 }, fileIcon: { alignItems: "center", borderRadius: 14, height: 40, justifyContent: "center", width: 40 }, fileInfo: { flex: 1 }, fileName: { fontSize: 13, fontWeight: "800" }, fileMeta: { fontSize: 11, marginTop: 3 },
});
