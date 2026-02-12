# Optimization Stage 2 — Code Maintainability

> **Goal:** Break apart the largest file, eliminate code duplication, and improve type safety — making the codebase easier to navigate and extend.

---

## 2.1 Break Up the 931-Line Room Page

#### [NEW] [hooks/useRoomGame.ts](file:///Users/chinoyoung/Code/flip/hooks/useRoomGame.ts)

Extract all game state management, Firestore subscriptions, and event handlers from the room page into a single custom hook.

Returns: `{ room, round, gamePhase, cumulativeScores, actionModal, handlers, uiState }`

#### [NEW] [components/game/LobbyView.tsx](file:///Users/chinoyoung/Code/flip/components/game/LobbyView.tsx)

Extract the "waiting" lobby UI (player list, target score, start button) into its own component.

#### [NEW] [components/game/PlayingView.tsx](file:///Users/chinoyoung/Code/flip/components/game/PlayingView.tsx)

Extract the active gameplay UI (scoreboard, player hand, card picker, other players, action modal) into its own component.

#### [MODIFY] [app/room/[code]/page.tsx](file:///Users/chinoyoung/Code/flip/app/room/%5Bcode%5D/page.tsx)

Reduce to a thin orchestrator (~50 lines):

```tsx
function RoomContent() {
  const game = useRoomGame(code);

  if (game.isLoading) return <LoadingState />;
  if (game.error) return <ErrorState />;
  if (game.gamePhase === "game-over") return <GameOverScreen {...} />;
  if (game.gamePhase === "round-end") return <RoundSummary {...} />;
  if (game.gamePhase === "playing") return <PlayingView {...} />;
  return <LobbyView {...} />;
}
```

---

## 2.2 Extract Shared Utilities

#### [NEW] [lib/utils.ts](file:///Users/chinoyoung/Code/flip/lib/utils.ts)

Move duplicated helpers into a shared module:

| Function | Currently Duplicated In |
|---|---|
| `formatDuration(ms)` | `app/history/page.tsx`, `app/history/[id]/page.tsx` |
| `formatDate(timestamp)` | `app/history/page.tsx`, `app/history/[id]/page.tsx` |

#### [NEW] [lib/game/card-utils.ts](file:///Users/chinoyoung/Code/flip/lib/game/card-utils.ts)

Move card display helpers from inline definitions:

| Function | Currently In |
|---|---|
| `getCardColor(card)` | `app/history/[id]/page.tsx` |
| `getCardLabel(card)` | `app/history/[id]/page.tsx` |

#### [MODIFY] [app/history/page.tsx](file:///Users/chinoyoung/Code/flip/app/history/page.tsx)
#### [MODIFY] [app/history/[id]/page.tsx](file:///Users/chinoyoung/Code/flip/app/history/%5Bid%5D/page.tsx)

Replace inline definitions with imports from the new shared modules.

---

## 2.3 Extract Player Avatar Component

#### [NEW] [components/ui/PlayerAvatar.tsx](file:///Users/chinoyoung/Code/flip/components/ui/PlayerAvatar.tsx)

The "avatar with initial fallback" pattern is repeated in 5+ files. Extract into a reusable component:

```tsx
interface PlayerAvatarProps {
  photoURL: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

#### [MODIFY] Files that use the avatar pattern:
- `app/room/[code]/page.tsx` (lobby + playing views)
- `app/leaderboard/page.tsx` (podium + rankings)
- `app/history/[id]/page.tsx` (standings)
- `components/game/ScoreBoard.tsx`
- `components/game/GameOverScreen.tsx`

---

## 2.4 Type Service Return Values

#### [MODIFY] [firestore-schema.ts](file:///Users/chinoyoung/Code/flip/lib/firestore-schema.ts)

Add named return types for service functions:

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

#### [MODIFY] [game-service.ts](file:///Users/chinoyoung/Code/flip/lib/game-service.ts)

Apply the new types to `addCardToHand()`, `endRoundAndAdvance()`, and other service functions.

---

## ✅ Deliverable
- Room page reduced from 931 lines to ~50 lines
- Zero duplicated utility functions
- Avatar rendered consistently across all pages
- Service API contracts are explicit and discoverable

## 🧪 Verification
- All game phases still render correctly (lobby → playing → round-end → game-over)
- Existing tests pass: `npm run test`
- No TypeScript errors: `npx tsc --noEmit`
- Visual spot-check: avatars look identical to current UI
