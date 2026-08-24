import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Linking, Platform } from "react-native";

import { getDownloadUrl } from "@/lib/chat-api";

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "download";
}

export async function downloadAndShareAttachment(storagePath: string, fileName: string, mimeType: string) {
  const url = await getDownloadUrl(storagePath);
  if (url.error) throw url.error;
  if (Platform.OS === "web") {
    await Linking.openURL(url.data);
    return;
  }

  const downloadsDirectory = new Directory(Paths.cache, "chat-downloads");
  downloadsDirectory.create({ idempotent: true, intermediates: true });
  const destination = new File(downloadsDirectory, `${Date.now()}-${safeFileName(fileName)}`);
  const downloaded = await File.downloadFileAsync(url.data, destination, { idempotent: true });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Downloaded successfully, but the device cannot open a share sheet.");
  await Sharing.shareAsync(downloaded.uri, { dialogTitle: `Download ${fileName}`, mimeType });
}
