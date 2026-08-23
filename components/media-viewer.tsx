import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { getDownloadUrl } from "@/lib/chat-api";
import { useColors } from "@/hooks/use-colors";
import type { MessageAttachment } from "@/shared/chat-types";

function VideoAsset({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => { instance.loop = true; });
  return <VideoView allowsFullscreen contentFit="contain" nativeControls player={player} style={styles.media} />;
}

export function MediaViewer({ attachment, visible, onClose }: { attachment: MessageAttachment | null; visible: boolean; onClose: () => void }) {
  const colors = useColors(); const [url, setUrl] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => { let active = true; if (!attachment || !visible) { setUrl(null); return; } void getDownloadUrl(attachment.storage_path).then((result) => { if (active && !result.error) setUrl(result.data); }); return () => { active = false; }; }, [attachment, visible]);
  const save = async () => { if (!attachment || !url) return; setSaving(true); try { const granted = await MediaLibrary.requestPermissionsAsync(false, attachment.kind === "video" ? ["video"] : ["photo"]); if (!granted.granted) throw new Error("Media permission is required to save this attachment."); const extension = attachment.file_name.includes(".") ? "" : attachment.kind === "video" ? ".mp4" : ".jpg"; const target = `${FileSystem.cacheDirectory}chat-${Date.now()}-${attachment.file_name}${extension}`; const file = await FileSystem.downloadAsync(url, target); await MediaLibrary.saveToLibraryAsync(file.uri); Alert.alert("Saved", "The attachment is available in your device gallery."); } catch (error) { Alert.alert("Could not save media", error instanceof Error ? error.message : "Please try again."); } finally { setSaving(false); } };
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}><View style={styles.backdrop}><StatusBar backgroundColor="#050914" style="light" /><View style={styles.header}><Pressable accessibilityLabel="Close media" onPress={onClose} style={styles.headerButton}><MaterialIcons color={colors.onPrimary} name="close" size={26} /></Pressable><Text style={[styles.fileName, { color: colors.onPrimary }]}>{attachment?.file_name ?? "Attachment"}</Text><Pressable accessibilityLabel="Save media" disabled={saving} onPress={() => void save()} style={styles.headerButton}>{saving ? <ActivityIndicator color={colors.onPrimary} /> : <MaterialIcons color={colors.onPrimary} name="download" size={24} />}</Pressable></View><View style={styles.stage}>{!url ? <ActivityIndicator color={colors.primary} size="large" /> : attachment?.kind === "video" ? <VideoAsset uri={url} /> : <Pressable delayLongPress={450} onLongPress={() => void save()} style={styles.mediaWrap}><Image contentFit="contain" source={url} style={styles.media} /></Pressable>}</View><Text style={styles.hint}>Long-press media to save to your device</Text></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { backgroundColor: "#050914", flex: 1 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 52 }, headerButton: { alignItems: "center", height: 42, justifyContent: "center", width: 42 }, fileName: { flex: 1, fontSize: 14, fontWeight: "800", marginHorizontal: 8, textAlign: "center" }, stage: { alignItems: "center", flex: 1, justifyContent: "center", padding: 16 }, mediaWrap: { alignItems: "center", flex: 1, justifyContent: "center", width: "100%" }, media: { height: "100%", maxHeight: 640, width: "100%" }, hint: { color: "#D5DEEF", fontSize: 12, paddingBottom: 28, textAlign: "center" } });
