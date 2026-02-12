# Stage 3 — Room System (Real-Time Multiplayer)

> **Goal:** Players can create/join rooms and see each other in real-time.

---

## 3.1 Room Service

#### [NEW] [lib/room-service.ts](file:///Users/chinoyoung/Code/flip/lib/room-service.ts)
Firestore operations:
- `createRoom(hostId)` → 6-char room code, writes to Firestore
- `joinRoom(code, player)` → adds player to room
- `leaveRoom(code, playerId)` → removes player
- `startGame(roomId)` → sets status to `playing`
- `subscribeToRoom(roomId, callback)` → `onSnapshot` listener

---

## 3.2 Landing Page

#### [MODIFY] [app/page.tsx](file:///Users/chinoyoung/Code/flip/app/page.tsx)
Home screen with "Create Room" / "Join Room" / "Past Games" buttons.

---

## 3.3 Room Page — Lobby Phase

#### [NEW] [app/room/[code]/page.tsx](file:///Users/chinoyoung/Code/flip/app/room/[code]/page.tsx)
Player list, shareable room code, "Start Game" (host only).

#### [NEW] [components/game/RoomHeader.tsx](file:///Users/chinoyoung/Code/flip/components/game/RoomHeader.tsx)
Room code display, copy-to-clipboard button, player count badge.

---

## ✅ Deliverable
- Create room → get code → second player joins via code
- Both see each other in real-time lobby
- Host can start the game

## 🧪 Verification
- Create room on device A → copy code
- Join room on device B with code → both players appear in lobby
- Third player joins → all three see updated list instantly
- Host clicks "Start Game" → all players transition to game view
