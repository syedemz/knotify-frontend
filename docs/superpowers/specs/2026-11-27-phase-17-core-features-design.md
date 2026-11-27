# Phase 17 — Core feature round-up (design spec)

- **Date:** 2026-11-27
- **Status:** Approved for implementation planning
- **Scope:** Frontend (`knotify-frontend`) and backend (`knotify-backend`)
- **Source:** `QA/nextsteps.txt` (7 numbered requirements)
- **Sequencing approach:** Foundations first, then feature-by-feature vertical slices (see "Approach selection" below)

---

## 1. Overview

Seven requirements from `QA/nextsteps.txt` are consolidated into a single phase per user directive. The seven requirements map to eight implementation groups (F1–F8) because the shared infrastructure for requirements #1, #4, #5, #7 is best delivered as a single foundations slice rather than being duplicated across feature groups.

| Group | Covers requirements | Summary |
|---|---|---|
| **F1** | Parts of #1, #4, #5, #7 | Shared foundations: S3 buckets, push-device table, filter schema, deck-shuffle flag, professional-category JSON split |
| **F2** | #1 (full) | Expo notifications end-to-end: push fan-out, notifications-history endpoint, in-app bell dropdown, chat tab badge, explore tab dot |
| **F3** | #2 (full) | Chat message pagination (20 initial / 30 subsequent via `onEndReached`) |
| **F4** | #3 (full) | Blocking UX surfaces: block button on profile + deck, Blocked subtab in Explore, preflight 403 wiring |
| **F5** | #4 (full) | Sophisticated filtering: FilterScreen UI, filter persistence, deck-query filter application with profession-first tiered sort, inbound-profession opt-in gate |
| **F6** | #5 (full) | Deck shuffle + endless loop (remove "come back later" copy, loop with reshuffle on exhaustion) |
| **F7** | #6 (full) | Profile edit: section pencils, edit modals, mutability matrix, optimistic updates |
| **F8** | #7 (full) | S3 upload during registration: upload service, Page 29 + Page 31 integration |

---

## 2. Repo restructuring

### 2.1 Frontend (`knotify-frontend/implementationplan.md`)

**Rename:**
- `implementationplan/phase-17-settings.md` → `implementationplan/phase-18-settings.md`. Update the `phase:` field inside the file from `17` to `18`. Update the index entry in `implementationplan.md` from phase 17 to phase 18. Keep all 5 stories (17.1–17.5) as-is, including the deep-link scaffolding story 17.5.

**Annotate:**
- Inside the renamed phase-18 PRD, add a note on story 17.2 (NotificationSettingsScreen + push token registration): "Push-token registration bootstrap is delivered by phase 17 F2.3. By the time this phase runs, device tokens are already registered; this story only covers the notification-preference toggle UI + `PATCH /users/me/notification-prefs` wiring." Do not surgically split the story — the annotation suffices.

**Create:**
- `implementationplan/phase-17-core-features.md` — new PRD. Title: `Core feature round-up — notifications, chat pagination, blocking UX, filtering, deck shuffle, profile edit, registration S3 uploads`. Contains ~43 stories grouped F1–F8 per this spec (see section 6 for the exact breakdown).
- Add an index entry for the new phase 17 ahead of phase 18.

### 2.2 Backend (`knotify-backend/implementationplan.md`)

**Absorb + delete:**
- Phase 12 (`implementationplan/phase-12-s3-photos.md`, not started) is absorbed into a new consolidated phase 15. The 7 stories of phase 12 become: F1.4 (buckets + VPC endpoint — ex-12.1 + ex-12.2), F1.5 (uploads Lambda + routes — ex-12.3 + ex-12.4), F1.6 (CloudFront + signed URLs — ex-12.5 + ex-12.6), and F8.6 (e2e test — ex-12.7). Story content is preserved mostly verbatim with the one architectural reshape: **two buckets (male + female), not one** (Q2 in section 3.2, user-approved).
- Delete phase 12 from the backend index.

**Create:**
- `implementationplan/phase-15-core-features.md`. Title: `Core features — notifications, chat pagination, blocking inbound gate, filtering, deck shuffle, profile edit, S3 uploads`. Contains the backend-owned stories from F1, F2, F3, F4, F5, F7, F8 of this spec.

**Unchanged:**
- Phase 10 (Observability), Phase 11 (Pre-launch hardening), Phase 14 (Supabase alternative) are not touched. They stay at their current indices and status.
- Phase 13 (Premium subscriptions) PRD file exists but is not currently indexed — pre-existing inconsistency, not introduced here. Out of scope.

**Final backend index entries (after this phase lands):**

```yaml
- phase: 10
  title: Observability consolidation
  file: implementationplan/phase-10-observability.md
  ready: false
  done: false
- phase: 11
  title: Pre-launch hardening
  file: implementationplan/phase-11-hardening.md
  ready: false
  done: false
- phase: 14
  title: Supabase alternative to Aurora RDS and private VPC
  file: implementationplan/phase-14-supabase-alternative.md
  ready: false
  done: false
- phase: 15
  title: Core features — notifications, chat pagination, blocking inbound gate, filtering, deck shuffle, profile edit, S3 uploads
  file: implementationplan/phase-15-core-features.md
  ready: false
  done: false
```

### 2.3 Memory housekeeping

The user's auto-memory at `.claude/projects/.../memory/wip_deck_backend_wiring.md` is stale — the real-deck wiring has shipped and is functioning (verified against the user's lived experience of sending/receiving connection requests). On first implementation session of phase 17, delete or mark-superseded this memory entry. This is a one-line task, not a story.

---

## 3. Approach selection + key decisions

### 3.1 Sequencing approach — foundations first, then feature-by-feature slices (recommended, user-approved)

Trade-off rationale: pure feature-by-feature (Approach A) risks mid-phase schema churn as later features need columns later ones didn't anticipate. Pure backend-first (Approach B) gives nothing demo-able until the midpoint. Foundations first (Approach C) settles all DB migrations + S3 infra + push-device plumbing in F1, then F2–F8 ship as independent demo-able vertical slices.

### 3.2 Chosen approaches, decision by decision

| ID | Decision | Choice | Rationale |
|---|---|---|---|
| Q1 | Professional-area registration field | Extend existing `professionalCategory.json` — split `"Medicine"` into MBBS/MD vs PhD. No backfill (no existing users are doctors). | User directive. |
| Q2 | S3 bucket topology | **Two literal buckets**, one per `sex`. | User directive. Enforcement by AWS object-ARN, not by application code. |
| Q3 | Deck exhaustion behaviour | **Server resets seen-tracker + reshuffles** when the pool is exhausted. Always returns at least one profile unless the global pool is empty. | User directive. Matches Tinder-style infinite-deck feel. |
| Q4 | Profile-edit mutability matrix | Per section 7.2 table. Username removed; PhotoBlockSection deferred to a future gallery section. | User directive. |
| Q5 | Filter ranking when multiple filters set | **Profession-first, then tiered sort** on remaining filters within each profession-match group. | User recommendation accepted. Keeps profession as the top-priority axis without a weight-tuning rabbit hole. |
| Q6 | "You don't match criteria" surfaces where? | **Preflight `GET /users/:userId/can-request`** — `SendRequestModal` consults it before showing the confirmation. | User recommendation accepted. Cleanest UX; no "sending…" flicker before rejection. |
| Q7a | Chat pagination trigger | **`onEndReached` of inverted `FlatList`** — auto-load, no pull-to-refresh. | User directive. Matches native WhatsApp. |
| Q7b | First/subsequent page size | **20 / 30** asymmetric. | User directive. |
| Q8a | Notification-item tap | **Deep-link navigation** to the relevant screen (chat room / profile / new chat). | User directive. |
| Q8b | Bell dot clear timing | **On dropdown open** (not on item tap). | User directive. |
| Q8c | What about notifications 11+? | **Truncate at 10**, no "See all" link. Full history screen is a future enhancement. | User directive. |
| Q9 | Real-deck backend wiring status | **Already shipped** — the stale memory note is superseded. | User verified against lived experience. |

---

## 4. Story breakdown

### 4.1 F1 — Shared foundations (ships first, nothing user-visible)

#### F1.1 — Professional-category dropdown split (frontend)

**Agent:** frontenddeveloper
**Depends on:** none

- Edit `src/config/options/professionalCategory.json`:
  - Remove: `"Medicine"`.
  - Add: `"Medicine — Doctor (MBBS / MD / MS / DM)"`, `"Medicine — PhD / Research"`.
- Audit screens that render `professional_category` for label-length overflow: `src/features/profile-sections/sections/ProfessionalCareerSection.tsx`, `src/features/landing/components/DeckCard.tsx`, `src/features/landing/components/CandidateHero.tsx`, `src/features/onboarding/screens/Page10ProfessionalCategoryScreen.tsx` (and its tests). Where overflow occurs, adjust the component or add ellipsis styling.
- No DB backfill required.

#### F1.2 — Filter schema migration (backend)

**Agent:** backenddeveloper
**Depends on:** none

- New migration in `db/migrations/` (next free index) adding to the `users` table:
  - `deck_filter_preferences JSONB NOT NULL DEFAULT '{}'::jsonb` — saved filter set shape:
    ```json
    {
      "age_min": 23,
      "age_max": 65,
      "religions": ["Islam"],
      "sects": ["Sunni"],
      "countries": ["IN", "PK"],
      "districts": ["Srinagar"],
      "min_education_level": "Bachelor's",
      "marital_statuses": ["Never married"],
      "professional_categories": ["Medicine — Doctor (MBBS / MD / MS / DM)"]
    }
    ```
    (Every key optional. Missing key = "All".)
  - `inbound_profession_filter_enabled BOOLEAN NOT NULL DEFAULT FALSE`.
  - `inbound_profession_filter_values TEXT[] NOT NULL DEFAULT '{}'::text[]` — capped at 3 by the PATCH endpoint (F5.2).
- Indexes:
  - GIN on `deck_filter_preferences` (for JSONB containment queries in the deck Lambda).
  - Btree on `inbound_profession_filter_enabled` (for cheap filtering in the preflight).

#### F1.3 — Deck Lambda shuffle flag + exhaustion-loop (backend)

**Agent:** backenddeveloper
**Depends on:** F1.2

- Extend the existing `knotify-match` / `knotify-deck` Lambda from phase 7:
  - Add server-side deterministic shuffle: `ORDER BY md5(user_id::text || candidate_id::text || :hour_bucket)` or equivalent (backend engineer picks the cheapest approach). `hour_bucket` = `floor(extract(epoch from now()) / 3600)`.
  - On seen-tracker exhaustion (phase-7 schema — whichever DynamoDB table or column tracks seen candidates per viewer), auto-reset server-side and reshuffle with a new hour bucket. The endpoint never returns an empty response unless the globally-eligible pool is literally zero (handled by F5.7 on the frontend).
- No DynamoDB schema change expected — the reset is a state transition on the existing seen-tracker.
- Integration test: view 100% of the pool, then call `/deck` once more → see shuffled repeats, not an empty response.

#### F1.4 — S3 bucket Terraform module (backend) — absorbs ex-12.1 + ex-12.2

**Agent:** backenddeveloper
**Depends on:** none

- `infrastructure/modules/s3/main.tf` creates **two** `aws_s3_bucket` resources:
  - `knotify-photos-male-${var.environment}-${random_id.suffix.hex}`
  - `knotify-photos-female-${var.environment}-${random_id.suffix.hex}`
- Each bucket:
  - `aws_s3_bucket_public_access_block` all-true.
  - `aws_s3_bucket_server_side_encryption_configuration` AES256.
  - `aws_s3_bucket_versioning` enabled.
  - `aws_s3_bucket_lifecycle_configuration`:
    - `delete-orphans` rule: objects under `uploads/staging/` expire after 1 day.
    - `intelligent-tiering` rule: objects under the user-folder paths (sha256-hash prefix) transition to STANDARD_IA after 30 days.
- `aws_vpc_endpoint` for S3 (Gateway type) is associated with the private subnet route tables from phase 1. Endpoint policy restricts to **both bucket ARNs** plus the Terraform state bucket if same account.
- Module outputs: `male_bucket_name`, `male_bucket_arn`, `female_bucket_name`, `female_bucket_arn`.
- Integration test (Lambda inside VPC): list each bucket from a private subnet, confirm no NAT or public route used.

#### F1.5 — `knotify-uploads` Lambda with per-sex presigned URLs (backend) — absorbs ex-12.3 + ex-12.4

**Agent:** backenddeveloper
**Depends on:** F1.4

- `src/functions/uploads/` Lambda implements:
  - `POST /v1/profile/photos` — presigned URL for a **profile-image** upload.
  - `POST /v1/profile/selfie` — presigned URL for a **selfie** upload.
- Each endpoint accepts `{ contentType, fileName }`, returns `{ uploadUrl, objectKey, expiresAt }`.
- Lambda reads `users.sex` from the DB (user_id from JWT sub, never from input) to pick which bucket to presign against.
- Object key layout:
  - Selfie: `<sha256(user_id)>/Selfie/<uuid>.jpg`
  - Profile image: `<sha256(user_id)>/ProfileImages/<uuid>.jpg`
- Presigned URL config:
  - `expiresIn=300` seconds.
  - `Content-Length-Range` 0..10 MB.
  - `x-amz-server-side-encryption: AES256` header required.
- Routes registered via `aws_apigatewayv2_route` with Cognito JWT authorizer.
- Integration tests:
  - Male user presigns a selfie, PUTs a JPEG, confirms object appears in the **male bucket** at the expected key.
  - Female user presigns a profile image, PUTs a JPEG, confirms object appears in the **female bucket** at the expected key.
  - 20 MB file rejected by `Content-Length-Range`.
  - Male user cannot presign into the female bucket (Lambda hardcodes the sex→bucket mapping, no input parameter accepts the bucket).

#### F1.6 — CloudFront distribution + signed-URL helper (backend) — absorbs ex-12.5

**Agent:** backenddeveloper
**Depends on:** F1.4

- Two `aws_cloudfront_distribution` resources (one per bucket), each with:
  - `OAC` (Origin Access Control) — bucket policy grants only this OAC.
  - `aws_cloudfront_public_key` + `aws_cloudfront_key_group` for signed-URL verification.
  - Private key stored in Secrets Manager.
- Helper module exposes `sign_photo_url(object_key: str, bucket_owner: Literal['male','female']) -> str` with 1-hour expiry.
- Integration test: Lambda generates a signed URL, test fetches it (receives object), same URL after 1h returns 403.
- **This story does NOT extend the profile PATCH handler** — that's F8.2.

#### F1.7 — Push-device registration (backend)

**Agent:** backenddeveloper
**Depends on:** none

- New migration adding table `push_devices`:
  ```sql
  CREATE TABLE push_devices (
    expo_push_token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('ios','android')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_push_devices_user ON push_devices(user_id);
  ```
- `POST /v1/push-tokens` endpoint:
  - Request body: `{ token: string, platform: 'ios' | 'android' }`.
  - Upsert on `expo_push_token` as PK; a repeat POST bumps `last_seen_at`.
  - Cognito JWT required; `user_id` from JWT sub, not request body.
- Fan-out logic (looking up `push_devices` + dispatching to Expo) lives in F2.1, not here.

### 4.2 F2 — Expo notifications end-to-end

#### F2.1 — Expo push fan-out hook (backend)

**Agent:** backenddeveloper
**Depends on:** F1.7, F2.2

- Extend the already-shipped phase-16 mutation handlers to also POST to Expo's push API after their primary side effects:
  - `knotify-friend-requests` POST handler → fan-out `{ type: 'friend_request', from_user_id, request_id }` to recipient's `push_devices`.
  - `knotify-friend-requests` accept handler → fan-out `{ type: 'friend_request_accepted', from_user_id, room_id }` to original sender.
  - `knotify-chat` message publish → fan-out `{ type: 'chat_message', room_id, sender_id, preview: <first 60 chars> }` to recipient's `push_devices`.
- Each fan-out ALSO writes a row to the `notifications` table (F2.2) for the recipient.
- Fan-out failures are non-blocking: log + CloudWatch metric, never 500 the parent mutation.

#### F2.2 — Notifications-history endpoint + table (backend)

**Agent:** backenddeveloper
**Depends on:** F1.7

- New migration adding:
  ```sql
  CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('friend_request','friend_request_accepted','chat_message')),
    payload JSONB NOT NULL,
    read_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
  ```
- Endpoints:
  - `GET /v1/notifications?limit=10` — returns latest 10 for caller, newest first. `limit` is clamped server-side to `[1, 50]`.
  - `POST /v1/notifications/mark-all-read` — bulk-sets `read_at = now()` for all unread rows of caller. Returns `{ marked: <count> }`.
- Both endpoints require Cognito JWT.

#### F2.3 — Frontend push-token registration + OS handler setup

**Agent:** frontenddeveloper
**Depends on:** F1.7

- `AuthProvider` calls `registerForPushNotifications()` (already exists in `src/services/push/expoPush.ts`) the moment `status` flips to `'authenticated'`. Guard against re-calls across re-mounts with a `useRef<boolean>` sentinel.
- Pass `platform` (ios/android) in the POST body to match F1.7's contract — small edit to `expoPush.ts`.
- `App.tsx` registers `Notifications.setNotificationHandler` globally so foreground pushes still show the system banner.
- Android: register notification channel using `theme.colors.notification.dot` (import at module boundary; falls back to a hex literal if that's not statically available). Logo asset is a stub with `TODO(asset)` tag — real logo to be provided.

#### F2.4 — Frontend deep-link tap handler + foreground event handler

**Agent:** frontenddeveloper
**Depends on:** F2.3

- `src/services/push/notificationHandlers.ts` — new module.
- Register `Notifications.addNotificationResponseReceivedListener` (backgrounded tap) and `addNotificationReceivedListener` (foreground delivery).
- Response parser: reads `notification.request.content.data.type` and dispatches:
  - `chat_message` → navigate to `AppTabs → Chat → ChatStack → ChatRoomScreen { roomId }`; invalidate `['messages', roomId]`, `['rooms']`.
  - `friend_request` → navigate to `AppTabs → Explore → ExploreStack → OtherProfileScreen { userId, source: 'request' }`; invalidate `['friend-requests', 'incoming']`.
  - `friend_request_accepted` → use `createOrGetRoomMutation` to resolve the room, then navigate to `ChatRoomScreen { roomId }`.
- Also wire from the dropdown item tap (F2.5) — shared helper.

#### F2.5 — Frontend bell dropdown + unread dot wiring

**Agent:** frontenddeveloper
**Depends on:** F2.2, F2.4

- `src/features/landing/components/HeaderBar.tsx`:
  - Replace the current no-op bell `onPress` with a dropdown trigger.
  - Replace the current `hasUnreadNotifications` prop (fed from dummy data) with a derived boolean from `useNotificationsQuery()`: `data.some(n => n.read_at === null)`.
- New `src/features/notifications/components/NotificationsDropdown.tsx`:
  - Positioned absolutely top-right of the landing screen (or a RN `Modal` — whichever is cleaner given safe-area handling; implementation detail).
  - Rendered list: `notifications` from `useNotificationsQuery()`, newest first, max 10 (matches server limit).
  - On mount (dropdown open): fire `useMarkAllNotificationsReadMutation()`. Optimistically set all `read_at = now()` in the cache → dot disappears immediately.
  - Per-item tap: shared deep-link handler from F2.4 → dropdown closes.
  - Empty state: "No notifications yet."
- New `src/features/notifications/api.ts`:
  - `NOTIFICATIONS_QUERY_KEY = ['notifications'] as const`.
  - `useNotificationsQuery()` → `GET /v1/notifications?limit=10`.
  - `useMarkAllNotificationsReadMutation()` → `POST /v1/notifications/mark-all-read`, invalidates `['notifications']`.

#### F2.6 — Frontend chat tab count badge + explore tab dot

**Agent:** frontenddeveloper
**Depends on:** F2.2

- `src/navigation/AppTabs.tsx`:
  - **Chat tab icon:** render a small count badge pill (circle, `theme.colors.notification.dot` background, white text) when `useRoomsQuery()` has rooms with `unreadCount > 0`. Badge content = total unread across rooms. Badge disappears when sum = 0 (e.g. after the user opens the Chat tab and the per-room read-receipt flow from phase 16 story 16.CH1 marks messages read).
  - **Explore tab icon:** render a plain dot (no number) when **either** `useIncomingRequestsQuery().data.length > 0` **or** `useNotificationsQuery()` has an unread `friend_request_accepted`. Dot clears when the Explore tab is focused (invalidate `['friend-requests', 'incoming']`).
- **Per-row unread pill in `ChatListScreen`:** add a small pill on the right of each row showing the row's `unreadCount`, hidden when zero. Clears when the row is tapped (per phase-16 read-receipt flow). Rooms list continues to sort by `last_message_at DESC` (already implemented).

### 4.3 F3 — Chat message pagination

#### F3.1 — Frontend chat pagination UX wiring

**Agent:** frontenddeveloper
**Depends on:** none

- `src/features/chat/api.ts` — adjust `useMessagesQuery(roomId)`:
  - First page: `limit=20` (new).
  - Subsequent pages: `limit=30` (existing).
  - The two-value asymmetry is implemented by reading `pageParam` on `queryFn` and sending the right `limit`.
- `src/features/chat/screens/ChatRoomScreen.tsx`:
  - Wire `onEndReached` on the inverted `FlatList` to `fetchNextPage()`.
  - `onEndReachedThreshold={0.2}`.
  - Guard: don't call if `isFetchingNextPage` or `!hasNextPage`.
  - Add a small "That's the beginning of your conversation" label at the top of the list when `!hasNextPage`.

#### F3.2 — Backend pagination contract-lock test

**Agent:** backenddeveloper
**Depends on:** none

- New integration test in the chat test suite:
  - Seed a room with 55 messages.
  - Call `listMessages(roomId, limit=20)` — expect 20 messages + a non-null `nextToken`.
  - Call `listMessages(roomId, limit=30, nextToken=<prev>)` — expect 30 messages + a non-null `nextToken`.
  - Call `listMessages(roomId, limit=30, nextToken=<prev>)` — expect 5 messages + a null `nextToken`.
- No implementation change expected — this is a contract-lock test. If it fails, that's a bug the test caught.

### 4.4 F4 — Blocking UX surfaces

#### F4.1 — Backend block cascade correctness

**Agent:** backenddeveloper
**Depends on:** none

- Verify + harden `POST /v1/blocks/{userId}`:
  - Deletes friendship rows between the two users (both directions) in the `friends` table.
  - Deletes pending `friend_requests` rows between the two (both directions).
  - Soft-deletes the shared chat room: if not already present, add `chat_rooms.deactivated_at TIMESTAMPTZ NULL`; set to `now()` on block.
  - `listMyRooms` (phase 8) excludes deactivated rooms for both members.
  - `onMessageInRoom` publishes are rejected for deactivated rooms (subscription filter already scoped to membership — add a deactivated check).
- Integration tests:
  - A blocks B after a friendship + 20 messages → rooms-list empty for both, friendship gone, pending-request rows gone, old messages preserved in DynamoDB, `listMessages(roomId)` returns 404.
  - B unblocks A → remain unfriended (no auto-restore), old room stays deactivated, they can create a new request + new room.

#### F4.2 — Backend friend-request send rejects when blocked

**Agent:** backenddeveloper
**Depends on:** F4.1

- Extend phase-16 `POST /friend-requests`:
  - Check `blocks(blocker=recipient, blocked=sender)` AND `blocks(blocker=sender, blocked=recipient)`.
  - Either exists → return `403 { code: 'blocked', message: '' }`.
- Integration tests: blocked user cannot send, non-blocked can, 403 code is exactly `'blocked'`.

#### F4.3 — Backend `GET /users/:userId/can-request` preflight

**Agent:** backenddeveloper
**Depends on:** F4.1, F4.2, F5.3

- New endpoint, Cognito JWT required:
  - `{ can_request: true }` OR `{ can_request: false, reason: 'blocked' | 'criteria_not_met' | 'already_friends' | 'request_pending' }`.
- Check ladder (first match wins; later checks skipped):
  1. `blocked` — either direction (same logic as F4.2).
  2. `criteria_not_met` — recipient has `inbound_profession_filter_enabled = TRUE` AND sender's `professional_category` ∉ recipient's `inbound_profession_filter_values`.
  3. `already_friends` — friendship row exists.
  4. `request_pending` — pending request row in either direction.
  5. `can_request: true` otherwise.
- No details about which filter / which profession are returned — only the opaque reason code.
- Integration tests: one per reason code.

#### F4.4 — Frontend block button on OtherProfileScreen

**Agent:** frontenddeveloper
**Depends on:** F4.1

- `src/features/profile/screens/OtherProfileScreen.tsx`:
  - Add `BlockActionButton` to `ContactActionsSection`.
  - Visible only on friend view and incoming-request view (`source: 'friend' | 'request'`) — not on deck swipe context (that has its own button in F4.5).
  - Tap → two-step `Alert.alert` (action sheet → confirm dialog), identical pattern to phase-16 story 16.10.
  - Confirm → `useBlockUserMutation.mutate({ userId })` → on success, `navigation.goBack()`.
  - Icon: `Ban` from `lucide-react-native`. Label: `t('otherProfile.actions.block')`.

#### F4.5 — Frontend block button on deck card

**Agent:** frontenddeveloper
**Depends on:** F4.1

- `src/features/landing/components/DeckCard.tsx`:
  - Small ghost icon button in the **bottom-left** corner of the card.
  - `Ban` icon only, no label.
  - Positioned inside card bounds but with `hitSlop` tuned so the swipe gesture doesn't accidentally trigger it.
  - Tap → same two-step confirm pattern as F4.4 → on confirm, invoke the existing swipe-out animation (treat as a "block" swipe) → invalidate `['deck']`.
- Same keyed-position logic as the like/pass controls (if they exist as buttons alongside swipe).

#### F4.6 — Frontend Blocked subtab on ExploreHomeScreen

**Agent:** frontenddeveloper
**Depends on:** F4.1

- `src/features/explore/screens/ExploreHomeScreen.tsx`:
  - Add a 4th subtab `Blocked` after Bookmarks: `Friends | Requests | Bookmarks | Blocked`.
  - Content: 2-column grid of blocked users' cards. Extract the existing `BookmarkCard` styling into a shared `ProfileCardTile` component (new in `src/components/catalog/`) and reuse it for both Bookmarks and Blocked grids.
  - Tile tap → confirm-unblock modal (NOT profile navigation): "Unblock {firstName}? They'll be able to appear in your deck and send you requests again." Confirm → `useUnblockUserMutation` → tile animates out.
- Labels:
  - `explore.blocked.tab = "Blocked"`
  - `explore.blocked.emptyTitle`, `explore.blocked.emptyDescription`
  - `explore.blocked.unblockConfirmTitle`, `explore.blocked.unblockConfirmBody`
- Existing phase-16 `BlockedUsersScreen` (reached via profile triple-dot menu) stays as a secondary surface — not deleted.

#### F4.7 — Frontend preflight wired into SendRequestModal

**Agent:** frontenddeveloper
**Depends on:** F4.3

- `src/features/landing/components/SendRequestModal.tsx`:
  - On open, fire `useCanRequestQuery(userId)` (new hook in `src/features/friendRequests/api.ts`, 30 s stale time).
  - Loading: show a small spinner inside the modal card.
  - `{ can_request: false, reason: 'blocked' }` → render a dismiss-only variant with `t('sendRequest.blockedTitle')` + `t('sendRequest.blockedBody')` ("You can't send this request" / "This user has blocked you"). No mention of criteria or identity of blocker.
  - `{ can_request: false, reason: 'criteria_not_met' }` → dismiss-only variant with `t('sendRequest.criteriaNotMetTitle')` + `t('sendRequest.criteriaNotMetBody')` ("You don't match this user's criteria" / "no more details"). Per user wording.
  - `{ can_request: false, reason: 'already_friends' }` → dismiss-only, "You are already friends."
  - `{ can_request: false, reason: 'request_pending' }` → dismiss-only, "A request is already pending."
  - `can_request: true` → existing confirmation flow (Send button → `useSendFriendRequestMutation`).
- On any `can_request: false` branch, invalidate `['deck']` so the user doesn't re-see this profile immediately.

### 4.5 F5 — Filtering

#### F5.1 — Backend deck filter application + profession-first tiered sort

**Agent:** backenddeveloper
**Depends on:** F1.2, F1.3

- Extend the `knotify-match` / `knotify-deck` Lambda:
  - Load caller's `deck_filter_preferences` (JSONB) on each deck fetch.
  - Candidates sorted by **tier number ascending**, where tier = `(0 if profession_match else N_other_filters_set + 1) + (N_other_filters_set - N_other_filters_matched)`. In plain English: profession match first; within each profession group, by number of matched filters descending.
  - Age filter: `candidate.age ∈ [age_min, age_max]`.
  - `min_education_level`: candidate's `education_level` ordinal ≥ caller's minimum. Education ordinals defined in a backend reference table (`education_levels(level TEXT PRIMARY KEY, ordinal INT NOT NULL)`), populated from `education-level-ordinal.json` or equivalent config.
  - All other filters are set-membership (`candidate.religion ∈ caller.religions`, etc.).
  - `professional_categories` filter is capped at **3**; the Lambda rejects with 400 if the JSONB has more.
  - Within each tier, the F1.3 deterministic shuffle orders the candidates.
- Integration tests:
  - All filters empty → pure shuffled pool, no tiering.
  - `professional_categories = ["Medicine — Doctor (MBBS / MD / MS / DM)"]` → doctors at the top.
  - Profession + district set → doctors in those districts first, then doctors elsewhere, then non-doctors in those districts, then everyone else.

#### F5.2 — Backend `PATCH /v1/profile/filters` endpoint

**Agent:** backenddeveloper
**Depends on:** F1.2

- Request body: full filter shape (replaces not merges — idempotent).
  ```json
  {
    "deck_filter_preferences": { ... },
    "inbound_profession_filter_enabled": false,
    "inbound_profession_filter_values": []
  }
  ```
- Validation:
  - `age_min >= 23 && age_max <= 65 && age_min <= age_max`.
  - `deck_filter_preferences.professional_categories.length <= 3`.
  - `inbound_profession_filter_values.length <= 3`.
  - Every religion/sect/country/district/education-level/marital-status/professional-category value validates against the backend reference tables. Invalid value → 400 `invalid_filter_value` + the offending field name.
- On success: no deck cache to invalidate server-side (deck is computed on-demand), but respond 200 so the frontend knows the next deck fetch will see the new filters.

#### F5.3 — Backend defense-in-depth: `POST /friend-requests` enforces inbound-profession filter

**Agent:** backenddeveloper
**Depends on:** F1.2, F4.2

- F4.3's preflight already evaluates the inbound-profession filter — but preflight can be skipped by a malicious client going straight to `POST /friend-requests`. This story adds the same check on the mutation endpoint itself.
- `POST /friend-requests`: if the recipient has `inbound_profession_filter_enabled = TRUE` AND the sender's `professional_category` ∉ `inbound_profession_filter_values`, return `403 { code: 'criteria_not_met' }`.
- Check ladder on the mutation: `blocked` (from F4.2) → `criteria_not_met` (this story) → normal create. `already_friends` and `request_pending` remain whatever the phase-16 handler already does (likely 409 Conflict for both).
- Integration tests: sender's profession is in recipient's inbound list → 201. Sender's profession is NOT in recipient's inbound list → 403 `criteria_not_met`. Recipient has `inbound_profession_filter_enabled = FALSE` → any profession passes.
- The frontend already handles `403 criteria_not_met` via F4.7.

#### F5.4 — Frontend FilterScreen UI

**Agent:** frontenddeveloper
**Depends on:** F1.1, F5.5

- New screen `src/features/filter/screens/FilterScreen.tsx`.
- Reached from `HeaderBar`'s left filter icon (`src/features/landing/components/HeaderBar.tsx` — replaces the no-op handler).
- Pushed as a modal stack from the Marriage landing tab.
- Sections in order (every section defaults to "All"):
  1. **Age** — dual-thumb `Slider`. Range 23–65. New dependency: `@miblanchard/react-native-slider` (record in `package.json` and the PRD teardown notes).
  2. **Religion + Sect** — nested selector. Selecting a religion reveals its sect sub-list. Multiselect across religions AND sects.
  3. **Current country of residence** — single-select sheet. Options from existing `countries.json`.
  4. **District in Kashmir** — multiselect checkbox list. New file `src/config/options/kashmirDistricts.json` (Srinagar, Baramulla, Anantnag, Kupwara, Pulwama, Bandipora, Budgam, Ganderbal, Shopian, Kulgam — confirm full list with backend reference table).
  5. **Minimum education** — single-select sheet. Options from the existing education-level JSON. Filter semantics: "at or above this level".
  6. **Marital status** — multiselect checkbox list.
  7. **Professional area** — multiselect with **max-3 enforcement**. 4th tap shows a toast: "You can pick up to 3 professions." Options from `professionalCategory.json` (post-F1.1 split).
  8. **Below section 7 only**: `Switch` row `t('filter.onlyReceiveRequestsFromTheseProfessions')`. When ON, the professional-area selection also becomes the `inbound_profession_filter_values` + `inbound_profession_filter_enabled = TRUE` at save time. When OFF, `inbound_profession_filter_enabled = FALSE` regardless of the professional-area selection.
- Header: Reset button (clears all to defaults) + Apply button (calls F5.5 Save).
- Detailed visual layout (spacing, colors, iconography, animations) is **deferred to `/implement-phase` brainstorm** per project convention. Reference images: `muzzscreenshots/filter*`.

#### F5.5 — Frontend filter state persistence hook

**Agent:** frontenddeveloper
**Depends on:** F5.2

- New module `src/features/filter/api.ts`:
  - `DECK_FILTERS_QUERY_KEY = ['deck-filters'] as const`.
  - `useDeckFiltersQuery()` → `GET /v1/profile/filters` (new backend endpoint, added here to F5.2 — read side alongside the PATCH).
  - `useUpdateDeckFiltersMutation()` → `PATCH /v1/profile/filters`.
    - `onSuccess`: invalidate `['deck']` and `['deck-filters']`.
    - `onError`: surface toast with backend error code.
- `FilterScreen` wraps form state in `useReducer` and syncs with `useDeckFiltersQuery` on first mount.
- Apply button calls `updateMutation.mutate(formState) → navigation.goBack()` on success.

#### F5.6 — Frontend deck query includes filter signature

**Agent:** frontenddeveloper
**Depends on:** F5.5

- `src/features/landing/api.ts` (or wherever `useDeckQuery` currently lives):
  - Add `filterSignature` to the query key: `['deck', filterSignature]`.
  - `filterSignature` = deterministic hash (SHA-256 or simpler stringify-sort) of `useDeckFiltersQuery().data`.
  - When filter data changes (user hits Apply), the signature changes, the query key changes, React Query auto-refetches.
- No backend contract change — the filters are already server-side state (loaded by the Lambda per F5.1).

#### F5.7 — Frontend empty-state for filtered-out pool

**Agent:** frontenddeveloper
**Depends on:** F5.6, F6.1

- In the rare case where the server returns an empty deck (whole pool excluded by filters — not the normal exhaustion loop case which F6.1 handles), `MarriageLandingScreen` renders a dedicated empty state:
  - Title: `t('deck.filteredOutTitle')` = "No profiles match your filters"
  - Body: `t('deck.filteredOutBody')` = "Try broadening your filters to see more people."
  - Button: `t('deck.filteredOutCta')` = "Open filters" → navigates to `FilterScreen`.
- Distinct from the generic loading state (F6.1) by the data check: `deck.length === 0 && !isLoading`.

### 4.6 F6 — Deck shuffle + endless loop

#### F6.1 — Delete "come back later" copy, swap in loading animation

**Agent:** frontenddeveloper
**Depends on:** F1.3

- Locate the current deck-exhausted empty state in `MarriageLandingScreen` (copy: "YOU HAVE SEEN ALL PROFILES, COME BACK LATER" or similar). Delete the copy + its component mount at that branch.
- When `useDeckQuery` returns a page with fewer than N items (N = current deck page size; confirm in implementation), auto-fire the next page fetch and render the generic `LoadingState` catalog component in the card area while in flight.
- Remove any label strings from `labels.en.json` + `labels.ur.json` that referenced the deleted copy.
- The server's F1.3 loop ensures the empty state almost never appears; F5.7 handles the "filters excluded everyone" edge case with its own copy.

#### F6.2 — Themed between-deck loading animation

**Agent:** frontenddeveloper
**Depends on:** F6.1

- Replace the generic `LoadingState` from F6.1 with a `DeckRefreshingAnimation` component.
- Pure RN, no new animation library — use `Animated.View` + `useNativeDriver`:
  - Three dots pulsing in `theme.colors.accent.primary`, staggered 150 ms, loop indefinitely while `isFetchingNextPage === true`.
  - Centered in the card slot.
- Tests: snapshot + a single integration test that verifies the animation renders while `useDeckQuery.isFetchingNextPage === true`.

### 4.7 F7 — Profile edit

#### F7.1 — Backend immutable-field enforcement

**Agent:** backenddeveloper
**Depends on:** none

- In the phase-6 profile PATCH handler, add a canonical immutable-fields constant:
  ```python
  IMMUTABLE_PROFILE_FIELDS = {
      "user_id","email","username","first_name","last_name","sex","birthday",
      "religion","subsect","fathers_name","mothers_name",
      "college_name","higher_secondary","high_school",
      "higher_secondary_passing_year","high_school_passing_year",
      "profile_complete_verified","created_at","updated_at","deleted_at",
      "age"
  }
  ```
- For every key in the PATCH body:
  - If the key is in `IMMUTABLE_PROFILE_FIELDS` AND its value ≠ the current DB value → `400 { code: 'immutable_field', field: '<name>' }`.
  - If the key is in `IMMUTABLE_PROFILE_FIELDS` AND its value == the current DB value → silently accept (idempotent PATCH).
- Integration tests: each immutable field, attempted change → 400. Echoed value → 200. Editable field → 200 + updated.

#### F7.2 — Frontend EditModal shell + section pencils

**Agent:** frontenddeveloper
**Depends on:** none

- New reusable component `src/components/catalog/EditModal.tsx`:
  - Props: `{ title: string, visible: boolean, onSave: () => void | Promise<void>, onCancel: () => void, saving: boolean, children: React.ReactNode }`.
  - Full-height sheet modal with backdrop.
  - Backdrop: `BlurView` from `expo-blur` at `intensity={30}` on supported platforms; falls back to `rgba(0,0,0,0.4)` solid overlay on unsupported platforms. New dependency: `expo-blur` (record in `package.json` and PRD teardown notes).
  - Scrollable body.
  - Footer: Cancel (ghost) + Save (filled). Save disabled while `saving === true` OR while form state equals initial state (dirty-check).
- New component `src/components/catalog/SectionPencil.tsx`:
  - Pencil `lucide-react-native` icon, 20px, `theme.colors.text.secondary`.
  - Rendered in the top-right of each editable section header on `MyProfileScreen` only.
- `src/features/profile/screens/MyProfileScreen.tsx`:
  - Add a dispatch map `{ sectionId: <SpecificEditModal /> }` and owns the open/close state.
  - `SectionPencil` tap → opens the corresponding modal.
  - Non-editable sections (HeroBlock, VerifiedProfileSection) render without a pencil.

#### F7.3 — Frontend fully-editable section modals

**Agent:** frontenddeveloper
**Depends on:** F7.2, F7.6

- Six modal components, each in its section's folder:
  - `AboutMeEditModal` — single multiline `TextArea` for `preferences.about_me`, 500-char counter.
  - `MarriageIntentionsEditModal` — `marriage_time` (dropdown), `relation` (dropdown).
  - `FuturePlansEditModal` — `move_abroad` (yes/no), `has_children` (yes/no), `marital_status` (dropdown).
  - `PersonalityEditModal` — the `preferences.*` personality keys surfaced in `PersonalitySection` (the section component defines the key set).
  - `ProfessionalCareerEditModal` — `professional_category` (dropdown from F1.1), `job_title` (text), `employer_name` (text), `employment_type` (dropdown), `office_address` (text), `salary_range` (dropdown).
  - `AddressEditModal` — `current_residence_country` (country picker that also writes `resident_country_code`), `current_residence_city` (text), `district` (text, NOT restricted to Kashmir districts — those are only the filter's enum), `family_residence_address` (multiline text).
- Each modal validates against the same JSON option lists as onboarding.
- Each modal calls `useUpdateProfileMutation()` from F7.6 on Save.

#### F7.4 — Frontend mixed-section edit modals

**Agent:** frontenddeveloper
**Depends on:** F7.2, F7.6

- Three modal components; display some fields as read-only "locked" rows and only allow editing of the editable fields:
  - `ParentsEditModal` — reads: `fathers_name`, `mothers_name`. Writes: `fathers_job`, `mothers_job`, `father_retired`, `mother_retired`.
  - `EducationEditModal` — reads: `college_name`, `higher_secondary`, `high_school`, their passing years. Writes: `education_level`, `highest_degree`, `graduation_year`.
  - `FaithEditModal` — reads: `religion`, `subsect`. Writes: `religious_level`, `partners_religious_level`.
- Locked row visual: `Lock` icon from `lucide-react-native` + grayed-out text + tap-to-show tooltip: `t('profileEdit.immutableTooltip')` = "This can't be changed after registration."

#### F7.5 — Frontend Siblings list editor modal

**Agent:** frontenddeveloper
**Depends on:** F7.2, F7.6

- `SiblingsEditModal`:
  - List of siblings, each row has Edit (expand to inline form) + Trash (confirm delete).
  - Add button adds a new inline-form row.
  - Fields per sibling: name, age, education, occupation, marital status.
  - Save → full-array PATCH (idempotent), consistent with F5.5's full-shape PATCH pattern.
- Follows the existing phase-7 siblings wire format (JSONB array in `preferences.siblings` or wherever phase 7 put them — honor the existing field name).

#### F7.6 — Frontend optimistic update + cross-surface cache invalidation

**Agent:** frontenddeveloper
**Depends on:** F7.1

- `src/features/profile/api.ts` — new `useUpdateProfileMutation()` hook keyed off `['profile', 'me']`.
- `onMutate`:
  - `queryClient.setQueryData(['profile', 'me'], prev => ({ ...prev, ...patch }))` — optimistic.
  - Return context `{ previous: prev }` for rollback.
- `onError(error, variables, context)`:
  - `queryClient.setQueryData(['profile', 'me'], context.previous)`.
  - Surface toast with error. Special-case `immutable_field` code (shouldn't happen if frontend respects the matrix, but defense-in-depth).
- `onSuccess`:
  - `queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })`.
  - `queryClient.invalidateQueries({ queryKey: ['deck'] })` — the viewer's own filter-affecting fields might have changed their reciprocal deck ordering.
  - Predicate-match invalidate `['profile', *]` for any other user who might have cached the viewer.
  - `queryClient.invalidateQueries({ queryKey: ['friends'] })`.
  - `queryClient.invalidateQueries({ queryKey: ['rooms'] })`.
- Integration tests:
  - Edit field → new value appears immediately (no flicker) → network 200 → cache settled.
  - Edit field → network 500 → rollback + toast.
  - Edit field → network 400 `immutable_field` → rollback + distinct toast.

### 4.8 F8 — S3 upload during registration

#### F8.1 — Backend schema additions for upload keys

**Agent:** backenddeveloper
**Depends on:** F1.4

- New migration adding:
  - `users.selfie_key TEXT NULL`.
  - `users.profile_image_keys TEXT[] NOT NULL DEFAULT '{}'::text[]`.
- Stored as **keys, not URLs** — signing happens on read, not write. Future bucket/CDN changes won't require a data migration.

#### F8.2 — Backend profile PATCH accepts upload keys with ownership validation

**Agent:** backenddeveloper
**Depends on:** F1.5, F8.1

- Absorbs ex-phase-12 story 12.6, reshaped:
  - `PATCH /v1/profile/me` accepts `selfie_key` and `profile_image_keys` in the body.
  - Validation per key:
    1. Key path must start with `<sha256(user_id)>/Selfie/` (for `selfie_key`) or `<sha256(user_id)>/ProfileImages/` (for `profile_image_keys[]`). Reject with `403 { code: 'invalid_key_ownership' }` otherwise.
    2. `headObject` call to the correct bucket (based on user's `sex`) to verify the object exists. Reject with `400 { code: 'key_not_uploaded' }` if it doesn't.
- No CloudFront URL rewrite on write — stored keys stay as keys.
- Integration tests:
  - Upload selfie → PATCH with key → GET returns same key.
  - User 2 tries to PATCH user 1's key → 403.
  - PATCH with a well-formed key but no S3 object → 400.

#### F8.3 — Frontend upload service

**Agent:** frontenddeveloper
**Depends on:** F1.5

- New module `src/services/uploads/photoUpload.ts`:
  - `uploadPhoto(file: { uri: string, contentType: string, fileName: string }, kind: 'selfie' | 'profile_image'): Promise<string>` — returns S3 object key on success.
  - Implementation:
    1. POST `/v1/profile/selfie` or `/v1/profile/photos` with `{ contentType, fileName }` → receive `{ uploadUrl, objectKey, expiresAt }`.
    2. `fetch(uploadUrl, { method: 'PUT', body: <blob>, headers: { 'Content-Type': contentType, 'x-amz-server-side-encryption': 'AES256' } })`.
    3. Non-2xx → throw typed `PhotoUploadError` (`'presign_failed' | 's3_put_failed' | 'file_too_large'`).
    4. Return `objectKey`.
- Optional progress callback parameter (stubbed; implementation deferred).

#### F8.4 — Frontend Page 29 profile-image upload integration

**Agent:** frontenddeveloper
**Depends on:** F8.3, F8.1

- `src/features/onboarding/screens/Page29PhotosScreen.tsx`:
  - On each image pick, immediately call `uploadPhoto(file, 'profile_image')`. Show a per-tile inline spinner.
  - On upload success, push the returned `objectKey` into `draft.profile_image_keys[]` (new draft field — add to `draftSchema.ts`).
  - On failure, show a toast + retry affordance.
  - User cannot proceed to Page 30 until every picked image has an `objectKey`.
  - User-removed images: silently drop from `profile_image_keys[]`. No S3 delete call — lifecycle rule handles orphans.

#### F8.5 — Frontend Page 31 selfie upload integration

**Agent:** frontenddeveloper
**Depends on:** F8.3, F8.1

- `src/features/onboarding/screens/Page31FaceCaptureScreen.tsx`:
  - On successful capture, immediately call `uploadPhoto(selfieFile, 'selfie')`.
  - Store returned `objectKey` in `draft.selfie_key` (new draft field — add to `draftSchema.ts`).
  - Retain the existing `TODO(mock-only)` secure-store write — the mock surface lives alongside the real upload. Teardown remains in `context.md` → Before shipping checklist.
  - Final onboarding PATCH already sends the full draft; now the draft includes `selfie_key` and `profile_image_keys` which the backend accepts (F8.2).
- Upload failure path: stay on Page 31 with retry button. No partial progression.

#### F8.6 — Backend end-to-end upload + read integration test

**Agent:** backenddeveloper
**Depends on:** F8.1, F8.2, F1.5, F1.6

- Absorbs ex-phase-12 story 12.7:
  - Sign up a user with `sex=male`, request presigned URL via POST `/v1/profile/selfie`, PUT a JPEG, PATCH `/profile/me` with the returned `selfie_key`, GET `/profile/me`, verify `selfie_key` matches.
  - Sign up user 2 with `sex=female`, confirm their presigned URL is against the female bucket. Confirm user 2 cannot PATCH with user 1's key (expect 403).
  - 20 MB file rejected by Content-Length-Range (verifies F1.5 config).

---

## 5. Open items / explicit non-goals

- **Logo asset for notifications (`F2.3`):** user will provide. Carried as `TODO(asset)` in code.
- **Full notifications history screen (Q8c):** deferred; only the latest-10 dropdown ships.
- **Photo gallery section in profile edit (Q4):** explicitly deferred to a future phase (user's words: "we will add a gallery section to it later").
- **Backfill for the professional-category split (Q1):** explicitly deferred — no existing users affected.
- **Pre-existing WIP memory note (`wip_deck_backend_wiring.md`):** will be deleted on first implementation session.
- **Pre-existing WIP memory note (`project_appsync_identity_subscription_filter.md`, `project_deck_view_refresh.md`):** unrelated, untouched.
- **Backend phase 13 (Premium subscriptions) PRD file is not indexed:** pre-existing inconsistency, untouched.

---

## 6. Estimated story count

Thirty stories total across two repos:

| Group | Count | Frontend | Backend |
|---|---|---|---|
| F1 | 7 | 1 | 6 |
| F2 | 6 | 4 | 2 |
| F3 | 2 | 1 | 1 |
| F4 | 7 | 4 | 3 |
| F5 | 7 | 4 | 3 |
| F6 | 2 | 2 | 0 |
| F7 | 6 | 5 | 1 |
| F8 | 6 | 3 | 3 |
| **Total** | **43** | **24** | **19** |

(43, not 30 — I underestimated in the Section 2 preview. The real breakdown is higher; the story-count number in the implementation plan will match what's here.)

---

## 7. Delivery sequencing (serial, per workspace non-parallelism rule)

Stories execute in strict dependency order, serially:

1. **F1 foundations block** (F1.1 → F1.2 → F1.3 → F1.4 → F1.5 → F1.6 → F1.7).
2. **F2 notifications** (F2.1 → F2.2 → F2.3 → F2.4 → F2.5 → F2.6).
3. **F3 chat pagination** (F3.1 + F3.2).
4. **F4 blocking surfaces** (F4.1 → F4.2 → F4.3 → F4.4 → F4.5 → F4.6 → F4.7).
5. **F5 filtering** (F5.1 → F5.2 → F5.3 → F5.4 → F5.5 → F5.6 → F5.7).
6. **F6 deck shuffle UX** (F6.1 → F6.2).
7. **F7 profile edit** (F7.1 → F7.2 → F7.3 → F7.4 → F7.5 → F7.6).
8. **F8 S3 upload during registration** (F8.1 → F8.2 → F8.3 → F8.4 → F8.5 → F8.6).

Each story ships with tests; group completion is signaled by all stories in the group `done: true`.
