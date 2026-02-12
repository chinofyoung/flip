import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    deleteDoc,
    doc,
    getDoc,
    where,
    type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Room, GameRecord, UserProfile } from "@/lib/firestore-schema";

/**
 * Checks if a user is an admin.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
    try {
        const userRef = doc(db, "users", userId);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
            const data = snapshot.data() as UserProfile;
            return !!data.isAdmin;
        }
        return false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

/**
 * Fetches all rooms (ordered by creation date, limited for performance).
 */
export async function getAllRooms(limitCount: number = 50): Promise<Room[]> {
    const roomsRef = collection(db, "rooms");
    const q = query(roomsRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
}

/**
 * Deletes a room by ID.
 */
export async function deleteRoom(roomId: string): Promise<void> {
    await deleteDoc(doc(db, "rooms", roomId));
}

/**
 * Fetches all games (ordered by creation date, limited for performance).
 */
export async function getAllGames(limitCount: number = 50): Promise<GameRecord[]> {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameRecord));
}

/**
 * Deletes a game by ID.
 */
export async function deleteGame(gameId: string): Promise<void> {
    await deleteDoc(doc(db, "games", gameId));
}

/**
 * Fetches all users/leaderboard entries (ordered by games won).
 */
export async function getAllUsers(limitCount: number = 50): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("gamesWon", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
}

/**
 * Deletes a user profile (leaderboard entry).
 * Note: This deletes their stats but not necessarily their ability to log in (Firebase Auth).
 */
export async function deleteUserStats(userId: string): Promise<void> {
    await deleteDoc(doc(db, "users", userId));
}
