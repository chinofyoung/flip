# Stage 2 — Core Game Logic

> **Goal:** All scoring rules implemented as pure, testable functions.

---

## 2.1 Types & Schema

#### [NEW] [lib/firestore-schema.ts](file:///Users/chinoyoung/Code/flip/lib/firestore-schema.ts)
TypeScript interfaces for all Firestore documents:

| Collection | Document Fields |
|---|---|
| `rooms` | `code`, `hostId`, `status` (waiting/playing/finished), `players[]`, `currentRound`, `createdAt` |
| `rooms/{id}/rounds/{n}` | `playerHands`, `playerStatuses` (active/stayed/busted/frozen), `turnOrder`, `currentTurnIndex` |
| `games` | `roomCode`, `players[]`, `rounds[]`, `finalScores`, `winnerId`, `createdAt`, `duration` |
| `users/{uid}` | `displayName`, `photoURL`, `gamesPlayed`, `gamesWon`, `totalScore`, `highestRoundScore` |

---

## 2.2 Deck Definition

#### [NEW] [lib/game/deck.ts](file:///Users/chinoyoung/Code/flip/lib/game/deck.ts)
Full 94-card deck:

| Card Type | Cards | Count |
|---|---|---|
| Number | 0 | 3 |
| Number | 1–12 | N copies = card value (1×1, 2×2 … 12×12) |
| Modifier | +2 | 3 |
| Modifier | +4 | 2 |
| Modifier | +10 | 1 |
| Modifier | x2 | 3 |
| Action | Freeze | 3 |
| Action | Flip Three | 3 |
| Action | Second Chance | 3 |

> [!NOTE]
> Verify against your physical deck and let me know if any counts differ.

---

## 2.3 Scoring Engine

#### [NEW] [lib/game/scoring.ts](file:///Users/chinoyoung/Code/flip/lib/game/scoring.ts)
- `calculateScore(hand)` — Sum numbers → x2 multipliers → + bonuses → Flip 7 bonus (+15)
- `isBusted(hand)` — Detects duplicate number cards
- `hasFlipSeven(hand)` — 7 unique number cards check

---

## 2.4 Action Card Logic

#### [NEW] [lib/game/actions.ts](file:///Users/chinoyoung/Code/flip/lib/game/actions.ts)
- **Freeze** → auto-stay the player
- **Flip Three** → queue 3 forced draws for target
- **Second Chance** → shield from one bust

---

## ✅ Deliverable
- All scoring logic works with unit tests
- Card types, deck composition, and bust detection verified

## 🧪 Verification
- Unit tests for `calculateScore()` with various hand combinations
- Bust detection with duplicate numbers
- Flip 7 detection (7 unique number cards = +15 bonus)
- x2 multiplier + bonus card interaction edge cases
- Edge cases: empty hand, all modifiers, 0-value cards
