# Stage 5 — Game History & Leaderboard

> **Goal:** Completed games are saved and browsable. All-time leaderboard.

---

## 5.1 Game History

#### [NEW] [app/history/page.tsx](file:///Users/chinoyoung/Code/flip/app/history/page.tsx)
List of past games — date, players, winner, final scores. Tap to view details.

#### [NEW] [app/history/[id]/page.tsx](file:///Users/chinoyoung/Code/flip/app/history/[id]/page.tsx)
Detailed result view: round-by-round breakdown, per-player cards drawn & scores.

---

## 5.2 Leaderboard

#### [NEW] [app/leaderboard/page.tsx](file:///Users/chinoyoung/Code/flip/app/leaderboard/page.tsx)
All-time stats: games won, win rate, highest round score, total points.

---

## ✅ Deliverable
- Past games viewable with full detail
- Leaderboard ranks players across all games

## 🧪 Verification
- Complete a game → navigate to `/history` → game appears in list
- Tap game → see round-by-round detail with correct scores
- Navigate to `/leaderboard` → stats reflect completed games
- Play more games → leaderboard updates accordingly
