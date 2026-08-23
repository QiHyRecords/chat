import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { downloadAndShareAttachment } from "@/lib/attachment-download";
import { getDownloadUrl } from "@/lib/chat-api";
import type { MessageAttachment } from "@/shared/chat-types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageAttachmentCard({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  const [url, setUrl] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  useEffect(() => { let active = true; getDownloadUrl(attachment.storage_path).then((result) => { if (active && !result.error) setUrl(result.data); }); return () => { active = false; }; }, [attachment.storage_path]);
  const download = async () => { setLoading(true); setError(null); try { await downloadAndShareAttachment(attachment.storage_path, attachment.file_name, attachment.mime_type); } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : "File download failed."); } finally { setLoading(false); } };
  if (attachment.kind === "image" && url) return <Pressable onPress={() => void download()} style={({ pressed }) => [styles.imageWrap, pressed && styles.pressed]}><Image source={url} contentFit="cover" style={styles.image} />{loading ? <View style={styles.imageOverlay}><ActivityIndicator color="#FFFFFF" /></View> : null}</Pressable>;
  const icon = attachment.kind === "video" ? "videocam" : attachment.kind === "audio" ? "graphic-eq" : "insert-drive-file";
  return <View><Pressable onPress={() => void download()} style={({ pressed }) => [styles.file, mine && styles.mineFile, pressed && styles.pressed]}><View style={[styles.fileIcon, mine && styles.mineIcon]}><MaterialIcons name={icon} color={mine ? "#FFFFFF" : "#3858E9"} size={22} /></View><View style={styles.fileInfo}><Text numberOfLines={1} style={[styles.fileName, mine && styles.mineText]}>{attachment.file_name}</Text><Text style={[styles.fileMeta, mine && styles.mineMeta]}>{attachment.kind === "audio" && attachment.duration_ms ? `${Math.ceil(attachment.duration_ms / 1000)} sec · ` : ""}{formatBytes(attachment.byte_size)}</Text>{error ? <Text style={styles.downloadError}>{error}</Text> : null}</View>{loading ? <ActivityIndicator color={mine ? "#FFFFFF" : "#3858E9"} /> : <MaterialIcons name="download" color={mine ? "#FFFFFF" : "#3858E9"} size={20} />}</Pressable></View>;
}

const styles = StyleSheet.create({ imageWrap: { borderRadius: 14, overflow: "hidden" }, image: { height: 190, width: 220 }, imageOverlay: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)", bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 }, file: { alignItems: "center", backgroundColor: "#FFFFFF", borderColor: "#DCE1ED", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, maxWidth: 260, minHeight: 64, padding: 10 }, mineFile: { backgroundColor: "#5370EE", borderColor: "#5370EE" }, fileIcon: { alignItems: "center", backgroundColor: "#E8EDFF", borderRadius: 10, height: 38, justifyContent: "center", width: 38 }, mineIcon: { backgroundColor: "rgba(255,255,255,0.18)" }, fileInfo: { flex: 1 }, fileName: { color: "#1C2332", fontSize: 13, fontWeight: "800" }, fileMeta: { color: "#687086", fontSize: 11, marginTop: 3 }, mineText: { color: "#FFFFFF" }, mineMeta: { color: "#E7EBFF" }, downloadError: { color: "#FFD2D2", fontSize: 10, marginTop: 3 }, pressed: { opacity: 0.75 } });
