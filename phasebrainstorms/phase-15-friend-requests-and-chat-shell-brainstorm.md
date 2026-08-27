# Phase 15 brainstorm — Friend requests + chat UI shell

## 2026-08-27 15:30 brainstorm

Reviewed against `implementationplan/phase-15-friend-requests-and-chat-shell.md`. Stories 15.1-15.7 validate structurally (all `frontenddeveloper`, non-empty ACs, `depends_on` in-phase). External asset `C:\Users\syede\Claude-Master\animations\images\BGDark.jpg` confirmed present. Both `TODO(mock-only)` callsites at `MarriageLandingScreen.tsx:307` and `BookmarkDeckViewScreen.tsx:136` match the PRD's expected wording. `theme.colors.text.link` does NOT exist in `src/theme/` — the 15.6 fallback (`accent.primary`) will be the actual pick.

Findings below are ordered by severity. B = blocker (address before dispatch), S = sharpen (clarify to make ACs testable), N = note (nice-to-have).

---

### B1 — [15.6] Missing snackbar consumer on MyProfileScreen for Accept/Decline

**Problem.** IncomingRequestModal calls `acceptRequest(userId)` / `declineRequest(userId)` and then `onClose()`. AC says "Snackbar surfacing is the host's responsibility (via existing `FriendshipProvider.pendingToast` handoff or a local snackbar on the host screen)". Two problems:

1. `pendingToast` is consumed by `ExploreHomeScreen` on focus (phase 13.4/13.5 handoff). If the user Accepts from the MyProfile modal, they stay on MyProfile — the toast never fires because Explore never gets focus.
2. Labels `friendRequests.incoming.acceptedToast` / `declinedToast` are declared but no host code path is spec'd to render them.

**Fix options.**
- (a) Mount a local `Snackbar` on `MyProfileScreen` and drive it directly from the modal's `onAccept` / `onDecline` callbacks (skip `pendingToast` for this surface).
- (b) Change modal handler signature to expose `onAccept` / `onDecline` callback props that the host wires (matches how 15.7's `onSayHi` is spec'd — internally consistent).
- (c) Broaden `pendingToast` consumers to include a lightweight `useEffect` inside `MyProfileScreen` that also consumes.

**Recommendation.** (b) is the cleanest: the modal fires the callback, host owns the persistence call + snackbar. Keeps the modal presentation-only and matches 15.7's shape. Requires editing 15.6 AC to move `acceptRequest`/`declineRequest` invocations from the modal into the host.

---

### B2 — [15.4] Hook-in-`renderItem` React rule violation

**Problem.** AC says "Last-message preview is derived per-row from `useChatHistory(friend.user_id).messages`". If the FlatList's `renderItem` inlines `useChatHistory()`, that's a Rules-of-Hooks violation — hooks must be at the top level of a component function, not inside a `renderItem` callback that only runs on demand.

**Fix.** Extract a `ChatListRow` component at `src/features/chat/components/ChatListRow.tsx`; `renderItem` returns `<ChatListRow friend={friend} onPress={...} />`; the hook lives at the top of `ChatListRow`. Zero scope change — just a naming pointer worth locking down before dispatch so tests aren't retrofitted.

**Recommendation.** Add to 15.4 AC: "Row is a standalone component `ChatListRow` at `src/features/chat/components/ChatListRow.tsx` — the `useChatHistory` call lives at the top of that component, not inside `renderItem`." One-line clarification.

---

### S1 — [15.5] Cross-tab nav "fixture test" is under-specified

**Problem.** AC last line reads "Add a fixture test that constructs the nested navigate call and asserts the params flow through." No test target: unit test on a spy'd `navigation.navigate`, or integration test with a real `NavigationContainer` + native-stack scaffold like `MenuStack.test.tsx`?

**Recommendation.** Pick the pattern up-front: reuse the phase-14 `ExploreStack.test.tsx` / `MenuStack.test.tsx` shape (real `NavigationContainer` + real `createNativeStackNavigator` with lightweight stub screens) so the params flow is verified through the actual navigation stack, not a spy. Add to 15.5 AC.

---

### S2 — [15.2 / 15.3] "Roughly 18" seed message count

**Problem.** 15.2 AC says "roughly 18 seed messages". 15.3 AC says "first mount for Mehvish seeds 18 messages" — implying the test asserts `.length === 18`. If 15.2 ships with 17 or 19, 15.3's test fails.

**Recommendation.** Lock 15.2 to exactly 18 (or reword 15.3's assertion to `>= 15`). Pick one and commit.

---

### S3 — [15.2] `.md` sidecar for base timestamp is a novel convention

**Problem.** JSON has no comments — the PRD suggests a companion `.md` sidecar next to `chatMehvish.json` documenting the base date. Phase 12 solved the same JSON-annotation problem via a `__mutability_notes` block **inside** the JSON (`assets/dummyprofile.json`). No `.md` sidecar precedent exists.

**Recommendation.** Store the base date as a top-level `_meta: { base_timestamp_ms: <number>, description: "..." }` block inside `chatMehvish.json` itself. Consistent with existing repo pattern. Update 15.2 AC.

---

### S4 — [15.5] `alignSelf` / background-colour assertions may be flaky

**Problem.** AC says "assert via style prop or testID + rendered style". RN Testing Library flattens style props (arrays, StyleSheet.create refs) unpredictably. `getByTestId('bubble-me').props.style` may return an array or an object depending on how MessageBubble composes them.

**Recommendation.** Pick one now: assert on a semantic `testID` (`bubble-sent` vs `bubble-received`) — the presence of that testID is proof of the sender-branch. Skip literal style-value assertions. Faster, less flaky, and still covers the intent.

---

### S5 — [15.6] Panel-append coupling with 15.7

**Problem.** AC on 15.6 says "design the panel so 15.7 only has to append". If the panel is a static component with one hard-coded button, 15.7 needs to edit the file. If it accepts a `triggers: Array<{ label, onPress }>` prop or a `children` slot, 15.7 is a one-line addition.

**Recommendation.** Slot-based: `DevTriggersPanel` renders a section heading + description + `children`. `MyProfileScreen` composes both buttons as siblings inside the panel. 15.6 ships with one button as the child; 15.7 appends the second. Clean append. Update 15.6 AC.

---

### N1 — [15.6/15.7] `text.link` token confirmed absent

**Note.** `theme.colors.text.link` does NOT exist in `src/theme/`. The AC fallback `accent.primary` will be the pick. Remove the "(or `accent.primary` if no link token)" hedge from the AC and just spec `accent.primary` directly to eliminate ambiguity.

---

### N2 — [15.5] `require()` path depth for BGDark import

**Note.** AC uses `require('../../../../assets/chat/bgDark.jpg')` — four levels of `../` from `src/features/chat/screens/ChatRoomScreen.tsx` resolves to project root, then `/assets/chat/bgDark.jpg`. Path is correct given current repo layout. No action needed, just verified.

---

### N3 — [15.7] Fixture mismatch acknowledged

**Note.** Mehvish is already a friend in `assets/dummyfriendships.json`, but RequestAcceptedModal semantically fires for a not-yet-friend user. The PRD notes acknowledge this cosmetic mismatch. Accept as-is — swapping to Qurat would require her to first be removed from `assets/dummyrequests.json` and dev-triggered separately, adding fixture churn for a mock-only surface.

---

### N4 — Assets already validated

- BGDark.jpg source exists at `C:\Users\syede\Claude-Master\animations\images\BGDark.jpg`.
- Both `TODO(mock-only)` callsites (`MarriageLandingScreen.tsx:307`, `BookmarkDeckViewScreen.tsx:136`) match the PRD's expected wording verbatim.
- `theme.colors.text.link` confirmed absent — see N1.

---

## Summary

**2 blockers** (B1, B2) that leave ACs non-testable as written and should be addressed in the PRD before dispatch.
**5 sharpens** (S1-S5) that would make dispatch cleaner but don't block if left as-is (subagent will resolve during implementation).
**4 notes** (N1-N4) — informational.

Nothing suggests scope drift into phases 16/17. The mock-only teardown checklist in the PRD is coherent.

## 2026-08-27 16:00 post-answers

User reviewed findings in `QA/explanations.txt` and picked fixes. PRD updated in the same commit.

**Decisions applied**:

- **B1 → (b)** IncomingRequestModal is now fully presentation-only with `onAccept(userId)` / `onDecline(userId)` callback props. MyProfileScreen mounts a local Snackbar (`useState<string | null>`), wires the callbacks to `acceptRequest` / `declineRequest` from `useFriendship()`, and shows the toast locally. `pendingToast` is NOT used for this surface. Consistent with 15.7's `onSayHi` shape.
- **B2 → (a)** Story 15.4 explicitly requires a standalone `ChatListRow` component at `src/features/chat/components/ChatListRow.tsx`. `useChatHistory` hook lives at that component's top level, never inside `FlatList.renderItem`. Tests split — `ChatListRow.test.tsx` covers row rendering + preview logic; `ChatListScreen.test.tsx` mocks the row and asserts prop pass-through + navigation.
- **S1 → (a)** Cross-tab nav test is an integration test at `__tests__/navigation/ChatStack.crossTab.test.tsx` following the phase-14 `MenuStack.test.tsx` / `ExploreStack.test.tsx` pattern (real `NavigationContainer` + real navigators + stub screens). No `jest.fn()` spy — end-to-end verification through the actual navigator.
- **S2 → (a)** Story 15.2 locked to **exactly 18** seed messages. 15.3's test can assert `.length === 18`.
- **S3 → (a)** Base timestamp stored INSIDE `chatMehvish.json` as a `_meta: { base_timestamp_ms, description }` block (matches `assets/dummyprofile.json` `__mutability_notes` precedent). Storage / provider code reads `.messages`, not the root. `.md` sidecar convention rejected. Note carried in the AC: when the real backend ships, whichever timestamp format it uses will replace this `_meta` block — that's fine, the mock lives in this fixture only.
- **S4 → (a)** MessageBubble uses semantic testIDs (`bubble-sent` / `bubble-received`). Tests query for the testID; do NOT assert literal style values (RNTL flattens styles unpredictably).
- **S5 → (a)** DevTriggersPanel is slot-based: `{ title?, description?, children }`. MyProfileScreen composes both trigger buttons as sibling children. 15.7 adds its button as a second child in MyProfileScreen's JSX — zero edits to `DevTriggersPanel.tsx`.
- **N1** `text.link` hedge dropped. AC now specifies `accent.primary` directly for the "View full profile" link colour.
- **N3** Mehvish retained as the RequestAcceptedModal dev-trigger fixture (already a friend, has full profile + chat history — happy path for dev testing). Semantic mismatch acknowledged as cosmetic per the PRD notes; will not exist in production.

**Files touched**:
- `implementationplan/phase-15-friend-requests-and-chat-shell.md` — 8 story-level edits; `last_updated` bumped.

**Nothing else changed**. Story dependency graph, agent assignments, and teardown checklist unchanged. Ready for Step 1 (create tracking issues) on next `/implement-phase 15` invocation.

## 2026-08-27 16:15 re-brainstorm (post-fix verification)

Re-ran the brainstorm pass against the updated PRD after applying all 2026-08-27 16:00 decisions. Confirming clean state:

- **B1 verified**: 15.6 modal is now callback-driven (`onAccept` / `onDecline`), host owns persistence + local Snackbar. ACs testable.
- **B2 verified**: 15.4 explicitly requires `ChatListRow` component; hook is at its top level, not in `renderItem`.
- **S1 verified**: 15.5 test target pinned to `__tests__/navigation/ChatStack.crossTab.test.tsx` with real-navigator scaffold.
- **S2 verified**: 15.2 locked to exactly 18 messages.
- **S3 verified**: 15.2 uses in-JSON `_meta` block; 15.3 reads `seedJson.messages`.
- **S4 verified**: 15.5 MessageBubble semantic testIDs; test AC forbids literal-style-value assertions.
- **S5 verified**: 15.6 DevTriggersPanel slot-based; 15.7 appends via sibling child.
- **N1 verified**: `text.link` hedge removed; `accent.primary` locked.

No new gaps surfaced. Dependency graph, agent assignments, teardown checklist unchanged. Proceed to Step 1 (tracking-issue creation + dispatch).
