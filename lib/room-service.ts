import {
  doc,
  collection,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from "firebase/firestore";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/firebase";
import type { Room, RoomPlayer, RoomStatus } from "@/lib/firestore-schema";

// Generate room codes without confusing characters (I, O, 0, 1)
const generateRoomCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  6
);

/**
 * Creates a new room with the host as the first player
 */
export async function createRoom(
  hostId: string,
  hostName: string,
  hostPhoto: string | null
): Promise<Room> {
  const code = generateRoomCode();
  const now = Date.now();

  const hostPlayer: RoomPlayer = {
    uid: hostId,
    displayName: hostName,
    photoURL: hostPhoto,
    joinedAt: now,
  };

  const roomRef = doc(collection(db, "rooms"));
  const roomData: Omit<Room, "id"> = {
    code,
    hostId,
    status: "waiting" as RoomStatus,
    players: [hostPlayer],
    currentRound: 0,
    targetScore: 200,
    createdAt: now,
  };

  await setDoc(roomRef, roomData);

  return {
    id: roomRef.id,
    ...roomData,
  };
}

/**
 * Joins an existing room by room code
 */
export async function joinRoom(
  code: string,
  player: RoomPlayer
): Promise<Room> {
  const normalizedCode = code.toUpperCase();

  // Query for room with matching code
  const roomsQuery = query(
    collection(db, "rooms"),
    where("code", "==", normalizedCode)
  );
  const querySnapshot = await getDocs(roomsQuery);

  if (querySnapshot.empty) {
    throw new Error("Room not found. Please check the room code.");
  }

  const roomDoc = querySnapshot.docs[0];
  const roomId = roomDoc.id;
  const roomRef = doc(db, "rooms", roomId);

  // Use transaction for atomic validation + write
  const updatedData = await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error("Room not found. Please check the room code.");
    }

    const roomData = roomSnapshot.data() as Omit<Room, "id">;

    // Validate room status
    if (roomData.status !== "waiting") {
      throw new Error("This game has already started.");
    }

    // Validate player isn't already in room
    const isPlayerInRoom = roomData.players.some((p) => p.uid === player.uid);
    if (isPlayerInRoom) {
      throw new Error("You are already in this room.");
    }

    // Validate room capacity
    if (roomData.players.length >= 8) {
      throw new Error("This room is full (maximum 8 players).");
    }

    // Add player to room
    transaction.update(roomRef, {
      players: arrayUnion(player),
    });

    // Return updated data by constructing it locally
    return {
      ...roomData,
      players: [...roomData.players, player],
    };
  });

  return {
    id: roomId,
    ...updatedData,
  };
}

/**
 * Removes a player from a room
 * If host leaves and others remain, transfers host to next player
 * If no players remain, deletes the room
 */
export async function leaveRoom(
  roomId: string,
  playerId: string
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error("Room not found.");
    }

    const roomData = roomSnapshot.data() as Omit<Room, "id">;
    const playerToRemove = roomData.players.find((p) => p.uid === playerId);

    if (!playerToRemove) {
      throw new Error("Player not found in room.");
    }

    // Remove the player
    const updatedPlayers = roomData.players.filter((p) => p.uid !== playerId);

    // If no players remain, delete the room
    if (updatedPlayers.length === 0) {
      transaction.delete(roomRef);
      return;
    }

    // If the leaving player was the host, transfer host to next player
    const isHostLeaving = roomData.hostId === playerId;
    const updates: Partial<Room> = {
      players: arrayRemove(playerToRemove) as any,
    };

    if (isHostLeaving) {
      updates.hostId = updatedPlayers[0].uid;
    }

    transaction.update(roomRef, updates);
  });
}

/**
 * Starts the game (host only)
 */
export async function startGame(
  roomId: string,
  hostId: string
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error("Room not found.");
    }

    const roomData = roomSnapshot.data() as Omit<Room, "id">;

    // Validate caller is the host
    if (roomData.hostId !== hostId) {
      throw new Error("Only the host can start the game.");
    }

    // Validate at least 2 players
    if (roomData.players.length < 2) {
      throw new Error("At least 2 players are required to start the game.");
    }

    // Validate status is waiting
    if (roomData.status !== "waiting") {
      throw new Error("Game already started.");
    }

    // Update room status and round
    transaction.update(roomRef, {
      status: "playing",
      currentRound: 1,
    });
  });
}

/**
 * Subscribes to real-time updates for a room
 * Returns an unsubscribe function
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  const roomRef = doc(db, "rooms", roomId);

  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const roomData = snapshot.data() as Omit<Room, "id">;
      callback({
        id: snapshot.id,
        ...roomData,
      });
    },
    (error) => {
      console.error("Error subscribing to room:", error);
      callback(null);
    }
  );
}

/**
 * Gets a room by its code
 */
export async function getRoomByCode(code: string): Promise<Room | null> {
  const normalizedCode = code.toUpperCase();

  const roomsQuery = query(
    collection(db, "rooms"),
    where("code", "==", normalizedCode)
  );
  const querySnapshot = await getDocs(roomsQuery);

  if (querySnapshot.empty) {
    return null;
  }

  const roomDoc = querySnapshot.docs[0];
  const roomData = roomDoc.data() as Omit<Room, "id">;

  return {
    id: roomDoc.id,
    ...roomData,
  };
}
