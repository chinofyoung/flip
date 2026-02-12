# Stage 4 — Game Play UI

> **Goal:** Full in-game experience — card selection, scoring, action cards, round flow.

---

## 4.1 State Management

#### [NEW] [lib/stores/game-store.ts](file:///Users/chinoyoung/Code/flip/lib/stores/game-store.ts)
Zustand store synced with Firestore snapshots:
- `room` — current room state
- `myHand` — local player's cards
- `scores` — all player scores per round
- `gamePhase` — lobby / playing / round-end / game-over

---

## 4.2 Game Service

#### [NEW] [lib/game-service.ts](file:///Users/chinoyoung/Code/flip/lib/game-service.ts)
- `addCardToHand(roomId, round, playerId, card)` — adds card, checks bust/action
- `playerStay(roomId, round, playerId)` — banks points
- `endRound(roomId)` — tallies scores, starts next round or ends game
- `saveGameResult(roomId)` — writes to `games` collection

---

## 4.3 Game Components

#### [NEW] [components/game/CardPicker.tsx](file:///Users/chinoyoung/Code/flip/components/game/CardPicker.tsx)
Grid of all card types — tap to add drawn card to hand.

#### [NEW] [components/game/PlayerHand.tsx](file:///Users/chinoyoung/Code/flip/components/game/PlayerHand.tsx)
Visual display of drawn cards + live auto-computed score.

#### [NEW] [components/game/ScoreBoard.tsx](file:///Users/chinoyoung/Code/flip/components/game/ScoreBoard.tsx)
All players' current round scores + cumulative total.

#### [NEW] [components/game/ActionCardModal.tsx](file:///Users/chinoyoung/Code/flip/components/game/ActionCardModal.tsx)
Player picker for targeting Flip Three / passing Second Chance.

#### [NEW] [components/game/RoundSummary.tsx](file:///Users/chinoyoung/Code/flip/components/game/RoundSummary.tsx)
End-of-round score breakdown per player.

#### [NEW] [components/game/GameOverScreen.tsx](file:///Users/chinoyoung/Code/flip/components/game/GameOverScreen.tsx)
Winner announcement + final standings. "Play Again" / "Exit".

---

## 4.4 Room Page — Game Phases

#### [MODIFY] [app/room/[code]/page.tsx](file:///Users/chinoyoung/Code/flip/app/room/[code]/page.tsx)
Wire up all game phases: Playing → Round Summary → Game Over.

---

## ✅ Deliverable
- Full game flow: select cards → auto-score → hit/stay → round end → next round → game over at 200 pts
- Action cards (Freeze, Flip Three, Second Chance) work
- All scores sync in real-time across players

## 🧪 Verification
- Player selects number cards → score auto-computes
- Player selects duplicate → bust triggered → score = 0
- Freeze card → player auto-stays
- Flip Three → 3 cards drawn for target
- Second Chance → survives one bust
- 7 unique numbers → Flip 7 bonus (+15)
- Player reaches 200+ pts → game over screen
- Host can manually end the current round via "End Round" button
- Player can leave the game and rejoin via room code, picking up their score
