import type { Session, User } from "@supabase/supabase-js";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getSessionProfile, getUnreadSummary, signOut as signOutRequest } from "@/lib/chat-api";
import { presentIncomingMessageNotification } from "@/lib/device-notifications";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/shared/chat-types";

type ChatAuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: Error | null;
  refreshProfile: () => Promise<void>;
  updateCachedProfile: (profile: Profile) => void;
  signOut: () => Promise<void>;
  unreadMessages: number;
  unreadNotifications: number;
  refreshUnreadCounts: () => Promise<void>;
};

const ChatAuthContext = createContext<ChatAuthContextValue | null>(null);

export function ChatAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshUnreadCounts = useCallback(async () => {
    const result = await getUnreadSummary();
    if (result.data) { setUnreadMessages(result.data.messages); setUnreadNotifications(result.data.notifications); }
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const result = await getSessionProfile();
      if (result.error) {
        setProfileError(result.error);
        setProfile(null);
        return;
      }
      setProfileError(null);
      setProfile(result.data);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      setSession(data.session);
      if (error) setProfileError(error);
      if (data.session) await refreshProfile();
      else setProfileLoading(false);
      setLoading(false);
    });

    const subscription = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setProfile(null);
        setProfileError(null);
        void refreshProfile();
      } else {
        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const onAppStateChange = (status: AppStateStatus) => {
      if (status === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!session?.user.id) return;
    void refreshUnreadCounts();
    const channel = supabase
      .channel(`notifications:${session.user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` }, (payload) => {
        const notification = payload.new as { kind?: string; title?: string; body?: string; data?: { conversation_id?: string } };
        if (notification.kind === "message" && notification.title && notification.body) {
          void presentIncomingMessageNotification(notification.title, notification.body, notification.data?.conversation_id ?? "");
        }
        void refreshUnreadCounts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user.id, refreshUnreadCounts]);

  const signOut = useCallback(async () => {
    setSession(null);
    setProfile(null);
    setProfileError(null);
    setProfileLoading(false);
    setLoading(false);
    setUnreadMessages(0);
    setUnreadNotifications(0);
    const result = await signOutRequest();
    if (result.error) throw result.error;
  }, []);

  const value = useMemo<ChatAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      profileError,
      refreshProfile,
      updateCachedProfile: setProfile,
      signOut,
      unreadMessages,
      unreadNotifications,
      refreshUnreadCounts,
    }),
    [session, profile, loading, profileLoading, profileError, refreshProfile, signOut, unreadMessages, unreadNotifications, refreshUnreadCounts],
  );

  return <ChatAuthContext.Provider value={value}>{children}</ChatAuthContext.Provider>;
}

export function useChatAuth() {
  const context = useContext(ChatAuthContext);
  if (!context) throw new Error("useChatAuth must be used within ChatAuthProvider.");
  return context;
}
