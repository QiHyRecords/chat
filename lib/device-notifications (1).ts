import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function configureDeviceNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("messages", {
      name: "Messages",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 150, 80, 150],
      lightColor: "#3858E9",
    });
  }
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== "granted") await Notifications.requestPermissionsAsync();
}

export async function presentIncomingMessageNotification(title: string, body: string, conversationId: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: { conversationId } },
    trigger: Platform.OS === "android" ? { channelId: "messages" } : null,
  });
}
