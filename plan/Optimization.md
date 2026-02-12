# Codebase Optimization Plan

> **Goal**: Make the Flip 7 codebase faster, more maintainable, and easier to extend — without breaking any existing game behavior.

---

## Phase 1 — Performance (High Impact)

### 1.1 Reduce Firestore Reads in `getUserGames`

**File**: `lib/history-service.ts` — `getUserGames()`

**Problem**: Fetches *all* game records and then filters client-side with `Array.filter()`. This reads every document in the `games` collection, which burns through Firestore read quotas and gets slower as the collection grows.

**Fix**: Replace the client-side filter with a Firestore compound query using `where("playerIds", "array-contains", userId)` so only relevant documents are returned.

```diff
- const q = query(gamesRef, orderBy("createdAt", "desc"), limit(50));
- const snapshot = await getDocs(q);
- return snapshot.docs
-   .map(...)
-   .filter(game => game.players.some(p => p.uid === userId));
+ const q = query(
+   gamesRef,
+   where("playerIds", "array-contains", userId),
+   orderBy("createdAt", "desc"),
+   limit(50)
+ );
```

> [!IMPORTANT]
> Requires a `playerIds: string[]` field on each `GameRecord` document. Existing documents must be backfilled, or a Cloud Function can populate it on write.

---

### 1.2 Avoid Redundant Score Recalculation in `endRoundAndAdvance`

**File**: `lib/game-service.ts` — `endRoundAndAdvance()`

**Problem**: On every round end, the function loops through *all* previous rounds and re-sums every player's scores from scratch using `getDoc()` calls. As the game progresses, this creates **O(rounds × players)** Firestore reads just to get a running total.

**Fix**: Maintain cumulative scores on the `Room` document directly. On each round end, add the current round's scores to the stored cumulative totals instead of re-reading all past rounds.

```diff
- // Current: read every round doc, sum from scratch
- for (let r = 1; r <= roundNumber; r++) {
-   const roundDoc = await getDoc(...);
-   // sum scores...
- }
+ // Better: cumulativeScores already on room doc, just add this round
+ for (const [uid, hand] of Object.entries(round.playerHands)) {
+   cumulativeScores[uid] = (room.cumulativeScores[uid] || 0) + roundScore;
+ }
```

---

### 1.3 Memoize Expensive Derived State in Room Page

**File**: `app/room/[code]/page.tsx`

**Problem**: Several computed values (e.g. `isUserInRoom`, `isHost`, `canStartGame`, `myHand`, `isMyTurnActive`) are recalculated on every render, even when their dependencies haven't changed.

**Fix**: Wrap with `useMemo` to avoid unnecessary recomputation during rapid re-renders (especially during real-time Firestore updates):

```tsx
const isUserInRoom = useMemo(
  () => room?.players.some((p) => p.uid === user?.uid) ?? false,
  [room?.players, user?.uid]
);
```

---

### 1.4 Dynamic Imports for Heavy Game Components

**File**: `app/room/[code]/page.tsx`

**Problem**: All 7 game components (`CardPicker`, `PlayerHand`, `ScoreBoard`, `ActionCardModal`, `RoundSummary`, `GameOverScreen`, `RoomHeader`) are bundled and loaded upfront, even when the user is in the lobby and doesn't need them yet.

**Fix**: Use `next/dynamic` with `{ ssr: false }` for phase-specific components:

```tsx
const GameOverScreen = dynamic(() => import("@/components/game/GameOverScreen"), { ssr: false });
const RoundSummary = dynamic(() => import("@/components/game/RoundSummary"), { ssr: false });
const CardPicker = dynamic(() => import("@/components/game/CardPicker"), { ssr: false });
```

---

## Phase 2 — Maintainability (Code Organization)

### 2.1 Break Up the 931-Line Room Page

**File**: `app/room/[code]/page.tsx` (931 lines)

**Problem**: This single file contains lobby UI, playing UI, round-end UI, game-over UI, all event handlers, and all subscription logic. It's difficult to navigate, test, and debug.

**Fix**: Extract into focused sub-components and a custom hook:

| New File | Responsibility |
|---|---|
| `hooks/useRoomGame.ts` | All game state, subscriptions, and handlers |
| `components/game/LobbyView.tsx` | Waiting room / lobby UI |
| `components/game/PlayingView.tsx` | Active gameplay UI |

The room page becomes a thin orchestrator:

```tsx
function RoomContent() {
  const { phase, ...game } = useRoomGame(code);

  if (phase === "game-over") return <GameOverScreen {...game} />;
  if (phase === "round-end") return <RoundSummary {...game} />;
  if (phase === "playing") return <PlayingView {...game} />;
  return <LobbyView {...game} />;
}
```

---

### 2.2 Extract Shared Utility Functions

**Problem**: `formatDuration()` and `formatDate()` are duplicated in `app/history/page.tsx` and `app/history/[id]/page.tsx`. `getCardColor()` and `getCardLabel()` are defined inline in the detail page and could be reused.

**Fix**: Create `lib/utils.ts` for shared formatting helpers and `lib/game/card-utils.ts` for card display helpers.

---

### 2.3 Extract Inline Player Avatar Component

**Problem**: The "avatar with fallback to initial" pattern is repeated across 5+ files (room page, leaderboard, history detail, scoreboard). Each copy has minor style differences that should be unified.

**Fix**: Create a `components/ui/PlayerAvatar.tsx` component:

```tsx
interface PlayerAvatarProps {
  photoURL: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg";
}
```

---

### 2.4 Consolidate Game Service Types

**File**: `lib/game-service.ts`

**Problem**: Return types for functions like `addCardToHand()` and `endRoundAndAdvance()` are defined as inline object types or not typed at all, making the API contract hard to discover.

**Fix**: Define explicit named types in `lib/firestore-schema.ts`:

```ts
export interface CardDrawResult {
  hand: PlayerHand;
  actionRequired: "flip-three" | "freeze" | "second-chance-pass" | null;
}

export interface RoundAdvanceResult {
  gameOver: boolean;
  cumulativeScores: Record<string, number>;
}
```

---

## Phase 3 — Code Quality & Safety

### 3.1 Add Error Boundaries for Game Components

**Problem**: If any game component throws during render (e.g. a malformed `round` object from Firestore), the entire app crashes with a blank screen.

**Fix**: Add a React Error Boundary component and wrap game phases:

```tsx
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component { ... }

// Usage in room page
<ErrorBoundary fallback={<ErrorFallback />}>
  <PlayingView {...game} />
</ErrorBoundary>
```

---

### 3.2 Strengthen Firebase Security with Validation

**File**: `lib/game-service.ts`, `lib/room-service.ts`

**Problem**: Several service functions don't validate inputs before writing to Firestore. For example, `addCardToHand()` doesn't check if the card ID is valid before adding it to the player's hand.

**Fix**: Add input validation at the start of each service function:

```ts
if (!roomId || !userId || !card?.id) {
  throw new Error("Invalid input: roomId, userId, and card are required");
}
```

---

### 3.3 Improve Firestore Listener Cleanup Pattern

**File**: `app/room/[code]/page.tsx`

**Problem**: The room subscription effect has `room?.id` as a dependency, but it accesses `user?.uid` from the outer scope without including it in the dependency array. This can lead to stale closures.

**Fix**: Include all accessed values in the dependency array, or use refs for values that shouldn't trigger re-subscription:

```tsx
useEffect(() => {
  // ...listener using user.uid...
}, [room?.id, user?.uid, router, setRoom, setGamePhase, setCumulativeScores]);
```

---

### 3.4 Expand Test Coverage

**Current**: Only `scoring.ts` and `actions.ts` have tests (648 lines total).

**Missing coverage**:

| Module | Suggested Tests |
|---|---|
| `lib/game/deck.ts` | Deck generation, shuffling, card distribution |
| `lib/room-service.ts` | Room creation, join/leave, code generation uniqueness |
| `lib/game-service.ts` | Round initialization, state transitions, edge cases |
| `lib/stores/game-store.ts` | Store actions, state updates, reset behavior |

---

## Phase 4 — Bundle & Asset Optimization

### 4.1 Optimize Next.js Config

**File**: `next.config.ts`

**Problem**: The config is essentially empty — no optimizations enabled.

**Fix**:

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};
```

---

### 4.2 Use `next/image` for User Avatars

**Problem**: All user profile photos use raw `<img>` tags, missing out on Next.js automatic image optimization (resizing, WebP conversion, lazy loading).

**Fix**: Replace `<img src={photoURL}>` with `<Image src={photoURL}>` from `next/image` across all components.

---

### 4.3 Tree-Shake Lucide Icons

**Problem**: Multiple files import from `lucide-react` using named imports. While Next.js handles this reasonably well, explicitly importing from subpaths ensures no unused icons leak into the bundle.

**Fix**: Enable `optimizePackageImports` in Next.js config (covered in 4.1), which handles this automatically.

---

## Optimization Stages

Each stage has its own detailed plan with file-level changes, deliverables, and verification steps:

| Stage | Focus | Risk | Impact |
|---|---|---|---|
| 🔴 [Stage 1](file:///Users/chinoyoung/Code/flip/plan/Optimization-Stage-1.md) | Firestore Performance | Low | High — eliminates unnecessary reads |
| 🟡 [Stage 2](file:///Users/chinoyoung/Code/flip/plan/Optimization-Stage-2.md) | Code Maintainability | Low | High — 931-line file → composable modules |
| 🟢 [Stage 3](file:///Users/chinoyoung/Code/flip/plan/Optimization-Stage-3.md) | Code Quality & Safety | Very Low | Medium — error boundaries, validation, tests |
| 🟢 [Stage 4](file:///Users/chinoyoung/Code/flip/plan/Optimization-Stage-4.md) | Bundle & Rendering | Very Low | Medium — faster loads, smoother UX |

---

> [!NOTE]
> All changes are additive or refactors—no game logic modifications. Existing tests should continue passing after each stage.
