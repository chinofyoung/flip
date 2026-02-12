# Optimization Stage 1 — Firestore Performance

> **Goal:** Eliminate unnecessary Firestore reads that burn quota and slow down the app as data grows.

---

## 1.1 Fix `getUserGames` Client-Side Filtering

#### [MODIFY] [history-service.ts](file:///Users/chinoyoung/Code/flip/lib/history-service.ts)

**Problem:** Fetches *all* game records then filters in JavaScript. Every call reads the entire `games` collection.

**Fix:** Replace with a Firestore compound query using `where("playerIds", "array-contains", userId)`.

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

#### [MODIFY] [firestore-schema.ts](file:///Users/chinoyoung/Code/flip/lib/firestore-schema.ts)

Add `playerIds: string[]` field to the `GameRecord` interface for the query index.

#### [MODIFY] [game-service.ts](file:///Users/chinoyoung/Code/flip/lib/game-service.ts)

Update `saveGameResult()` to populate the `playerIds` array when writing game documents.

> [!IMPORTANT]
> Existing `games` documents won't have `playerIds`. Either backfill them with a one-time script or accept that only new games will appear in filtered queries.

---

## 1.2 Eliminate Redundant Score Recalculation

#### [MODIFY] [game-service.ts](file:///Users/chinoyoung/Code/flip/lib/game-service.ts) — `endRoundAndAdvance()`

**Problem:** Re-reads *all* previous round documents every time a round ends to sum cumulative scores. Creates **O(rounds × players)** Firestore reads.

**Fix:** Read the existing `cumulativeScores` from the `Room` document and add only the current round's scores.

```diff
- // Current: loop through all rounds
- for (let r = 1; r <= roundNumber; r++) {
-   const roundDoc = await getDoc(doc(db, `rooms/${roomId}/rounds/${r}`));
-   // sum each player's score...
- }
+ // Better: use stored cumulative, add this round only
+ const existingScores = roomData.cumulativeScores || {};
+ for (const [uid, hand] of Object.entries(roundData.playerHands)) {
+   const roundScore = hand.status === "busted" ? 0 : hand.score;
+   cumulativeScores[uid] = (existingScores[uid] || 0) + roundScore;
+ }
```

---

## ✅ Deliverable
- `getUserGames()` uses a server-side Firestore query instead of client-side filter
- `endRoundAndAdvance()` no longer re-reads past rounds
- Firestore read count per round is constant (O(1)) instead of growing with rounds played

## 🧪 Verification
- Call `getUserGames(uid)` → only returns games that user participated in
- Play a 5+ round game → confirm no performance degradation as rounds increase
- Check Firestore console → read count per round-end stays flat
- Existing tests still pass: `npm run test`
