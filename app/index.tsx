import { Redirect } from "expo-router";

import { FullScreenLoader } from "@/components/chat-ui";
import { useChatAuth } from "@/providers/chat-auth-provider";

export default function IndexRoute() {
  const { loading, user } = useChatAuth();
  if (loading) return <FullScreenLoader />;
  return <Redirect href={(user ? "/(tabs)" : "/welcome") as never} />;
}
