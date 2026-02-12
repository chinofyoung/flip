# Optimization Stage 3 — Code Quality & Safety

> **Goal:** Add safety nets for production: error boundaries, input validation, proper listener cleanup, and expanded test coverage.

---

## 3.1 Add React Error Boundary

#### [NEW] [components/ErrorBoundary.tsx](file:///Users/chinoyoung/Code/flip/components/ErrorBoundary.tsx)

A class component that catches render errors and shows a recovery UI instead of a blank screen.

```tsx
<ErrorBoundary fallback={<GameErrorFallback />}>
  <PlayingView {...game} />
</ErrorBoundary>
```

#### [MODIFY] [app/room/[code]/page.tsx](file:///Users/chinoyoung/Code/flip/app/room/%5Bcode%5D/page.tsx)

Wrap each game phase with `<ErrorBoundary>` to isolate failures.

---

## 3.2 Input Validation in Services

#### [MODIFY] [game-service.ts](file:///Users/chinoyoung/Code/flip/lib/game-service.ts)

Add guards at the top of critical functions:

| Function | Validation |
|---|---|
| `addCardToHand()` | Verify `roomId`, `userId`, and `card.id` are present |
| `playerStay()` | Verify player exists in round and is `active` |
| `endRoundAndAdvance()` | Verify round is actually complete |
| `initializeRound()` | Verify player UIDs array is non-empty |

#### [MODIFY] [room-service.ts](file:///Users/chinoyoung/Code/flip/lib/room-service.ts)

| Function | Validation |
|---|---|
| `joinRoom()` | Verify room is in `waiting` status |
| `startGame()` | Verify caller is host and ≥2 players |
| `updateTargetScore()` | Verify score is a positive integer |

---

## 3.3 Fix Firestore Listener Dependencies

#### [MODIFY] [app/room/[code]/page.tsx](file:///Users/chinoyoung/Code/flip/app/room/%5Bcode%5D/page.tsx)

**Problem:** Room subscription effect accesses `user?.uid` inside the callback but doesn't include it in the dependency array, causing stale closures.

**Fix:** Add all accessed values to dependencies, or use `useRef` for stable references:

```diff
  useEffect(() => {
    // ...listener uses user.uid for host check...
- }, [room?.id, router, setRoom, setGamePhase]);
+ }, [room?.id, user?.uid, router, setRoom, setGamePhase, setCumulativeScores]);
```

---

## 3.4 Expand Unit Test Coverage

#### [NEW] [lib/game/__tests__/deck.test.ts](file:///Users/chinoyoung/Code/flip/lib/game/__tests__/deck.test.ts)

Tests for:
- Full deck has correct card count (94 cards)
- `shuffleDeck()` returns all cards in randomized order
- Card type distribution matches specification

#### [NEW] [lib/stores/__tests__/game-store.test.ts](file:///Users/chinoyoung/Code/flip/lib/stores/__tests__/game-store.test.ts)

Tests for:
- `setRoom()`, `setRound()`, `setGamePhase()` state updates
- `showActionModal()` / `hideActionModal()` toggling
- `reset()` clears all state back to defaults
- `setCumulativeScores()` merges correctly

---

## ✅ Deliverable
- Runtime errors show a recovery UI instead of blank screen
- Invalid inputs are caught before hitting Firestore
- No stale closure bugs in real-time listeners
- Test coverage extended to deck generation and game store

## 🧪 Verification
- Trigger an error boundary by temporarily throwing in a component → recovery UI shows
- Call `addCardToHand()` with empty `roomId` → throws descriptive error
- Run full test suite: `npm run test` → all pass (including new tests)
- TypeScript check: `npx tsc --noEmit` → no errors
