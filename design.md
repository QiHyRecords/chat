# Chat — Mobile Interface Design

## Product direction

Chat is an Android-first, private and group messaging service. The interface uses a calm dark graphite surface, blue-violet action color, prominent readable type, and contained cards only where they clarify a task. The design avoids imitating Discord or Apple interfaces: conversation lists are spacious, actions are contextual, and operational states such as sending, downloading, blocking, or saving are explicit. All layouts assume a **9:16 portrait viewport** and should remain convenient for one-handed use, with primary actions in the lower reach zone.

## Screen list and content

| Screen | Primary content and functionality |
|---|---|
| Welcome | Brief product introduction with routes to sign in and account registration. |
| Sign in | Email and password fields, password recovery link, persistent-session sign-in, visible loading and error states. |
| Create account | Display name, username, email, password, and confirmation fields; inline validation; account creation only after valid input. |
| Texting | A recent-conversation FlatList showing avatar, private/group marker, last-message preview, timestamp, and unread count. A floating compose action opens a friend or group chooser. |
| Conversation | Realtime message list with clearly differentiated incoming and outgoing messages, sender information in groups, reply context, reactions, attachment previews, a contextual message action sheet, and anchored composer. |
| Attachment viewer | Full-screen image/video preview or file information, download action, loading/error states, and a dismiss control. |
| New conversation | Searchable friend selector for a private conversation and a creation path for a group. |
| Create group | Group name, optional image, selected members, and submission feedback. |
| Group details | Group avatar/name, member list and role labels, invite controls where permitted, and member management controls for owner/moderators. |
| Notifications | Time-ordered list of friend requests, group invitations, and relevant activity with actionable accept/decline controls. |
| Friends | Search, received/sent requests, active friends, blocked users entry, and relevant relationship actions. |
| User profile | Public avatar, display name, username, optional badges in a dedicated row below the username, optional bio, and context-aware actions. Own profile presents editing/settings; another user presents friend, message, block, and report actions only. |
| Edit profile | Avatar selection/preview/upload feedback, display-name, username, and bio fields, a disabled-until-changed save action, and unsaved-change discard confirmation. |
| Account | Current-account summary, profile editing route, security settings, notifications preferences, sign out, account recovery, and account deletion route. |
| Report | Target context, reason picker, optional explanation, submission status, and privacy notice. |
| Call interface | Voice/video call pre-join and in-call interface with mute, video, speaker, camera-flip, hang-up, and call-back controls. It makes clear that signaling/media transport is not yet enabled. |

## Key user flows

| Flow | Steps |
|---|---|
| Registration | Welcome → Create account → complete validation → create Supabase Auth account → profile row created by backend trigger → Texting. |
| Start a private conversation | Friends → select friend → Message → conversation opens → compose text or attachment → realtime delivery and unread state update. |
| Create a group | Texting → compose → New group → choose members/name → create → Group details / conversation → invite or role controls appear only when authorized. |
| Edit profile | Account → Edit profile → make changes / select avatar → Save changes → backend validation and RLS-enforced update → refreshed profile information across all views. |
| Manage a friend request | Notifications or Friends → received request → Accept or Decline → backend relationship mutation → list and badges refresh. |
| Moderate an account | Other user profile or message actions → Report or Block → confirmation → secure backend action → user interface reflects blocked/report-submitted state. |
| Send voice message | Conversation → hold record control → release to preview/send → upload audio to private storage → message inserts with audio attachment metadata. |

## Interaction and layout rules

Conversation lists use one clear row target per item, with a minimum comfortable touch area. The composer stays above the keyboard, while attachment, voice, send, and reply actions are visible without opening a crowded secondary toolbar. Destructive actions use confirmation sheets. Network, upload, and realtime failures use persistent but dismissible feedback and never silently discard a drafted message or profile edit.

Badges are **never beside a username**. When present, a compact icon row sits below the username and above the bio: crown for OWNER, shield for ADMIN, code glyph for DEV, and check mark for VERIFIED. The entire badge container is hidden when a profile has no badges.

## Color choices

| Token | Hex | Intended use |
|---|---:|---|
| Ink | `#10131A` | Dark-mode application background and high-contrast header surface. |
| Canvas | `#F7F8FC` | Light-mode screen background. |
| Surface | `#FFFFFF` / `#191E29` | Cards, composer, modal sheets, and grouped controls. |
| Signal Blue | `#3858E9` | Primary calls to action, selected tab, outgoing message emphasis, focus treatment. |
| Iris | `#7048E8` | Subtle gradient accent and group identity details. |
| Text | `#171B25` / `#F5F7FC` | Primary reading text. |
| Secondary text | `#687086` / `#A9B1C1` | Metadata, timestamps, and labels. |
| Divider | `#E4E7EF` / `#30394B` | Row separation and quiet field borders. |
| Positive | `#178C64` | Confirmed delivery, accepted request, and success states. |
| Warning | `#C97815` | Pending actions and warning states. |
| Destructive | `#D74343` | Report, block, deletion, and validation-error states. |

## Accessibility and quality bar

All controls require labels, visible focus/pressed feedback, readable contrast, and explicit text for non-color states. Empty states explain the next valid action. Loading states preserve context. The initial Android experience supports system light/dark appearance and uses native-safe insets, predictable sheets, keyboard avoidance, and scalable text.
