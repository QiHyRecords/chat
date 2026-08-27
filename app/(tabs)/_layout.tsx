import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { HapticTab } from "@/components/haptic-tab";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useChatAuth } from "@/providers/chat-auth-provider";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { unreadMessages, unreadNotifications } = useChatAuth();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;
  const formatBadge = (count: number) => (count > 99 ? "99+" : count > 0 ? String(count) : undefined);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.elevated,
          borderTopWidth: 0,
          elevation: 14,
          shadowColor: colors.clayShadow,
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.22,
          shadowRadius: 16,
        },
        tabBarActiveBackgroundColor: colors.accentSoft,
        tabBarItemStyle: { borderRadius: 18, marginHorizontal: 4, marginVertical: 3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Texting",
          tabBarBadge: formatBadge(unreadMessages),
          tabBarIcon: ({ color }) => <MaterialIcons size={25} name="forum" color={color} />,
        }}
      />
      <Tabs.Screen name="notifications" options={{ title: "Notifications", tabBarBadge: formatBadge(unreadNotifications), tabBarIcon: ({ color }) => <MaterialIcons size={25} name="notifications-none" color={color} /> }} />
      <Tabs.Screen name="friends" options={{ title: "Friends", tabBarIcon: ({ color }) => <MaterialIcons size={25} name="people-outline" color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <MaterialIcons size={25} name="account-circle" color={color} /> }} />
    </Tabs>
  );
}
