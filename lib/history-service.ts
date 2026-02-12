import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc,
    setDoc,
    increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GameRecord, UserProfile } from "@/lib/firestore-schema";

/**
 * Fetches the most recent completed games.
 */
export async function getRecentGames(
    count: number = 20
): Promise<GameRecord[]> {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, orderBy("createdAt", "desc"), limit(count));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as GameRecord[];
}

/**
 * Fetches games for a specific user.
 */
export async function getUserGames(
    userId: string,
    count: number = 20
): Promise<GameRecord[]> {
    const gamesRef = collection(db, "games");
    // Since players is an array of objects, we query all games and filter client-side
    const q = query(gamesRef, orderBy("createdAt", "desc"), limit(count * 3));
    const snapshot = await getDocs(q);

    const allGames = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as GameRecord[];

    return allGames
        .filter((game) => game.players.some((p) => p.uid === userId))
        .slice(0, count);
}

/**
 * Fetches a single game by ID.
 */
export async function getGameById(
    gameId: string
): Promise<GameRecord | null> {
    const gameRef = doc(db, "games", gameId);
    const snapshot = await getDoc(gameRef);

    if (!snapshot.exists()) return null;

    return { id: snapshot.id, ...snapshot.data() } as GameRecord;
}

/**
 * Updates user profile stats after a game.
 */
export async function updateUserStats(
    userId: string,
    displayName: string,
    photoURL: string | null,
    gameScore: number,
    highestRound: number,
    won: boolean
): Promise<void> {
    const userRef = doc(db, "users", userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        // Create new profile
        const profile: UserProfile = {
            uid: userId,
            displayName,
            photoURL,
            gamesPlayed: 1,
            gamesWon: won ? 1 : 0,
            totalScore: gameScore,
            highestRoundScore: highestRound,
        };
        await setDoc(userRef, profile);
    } else {
        const existing = snapshot.data() as UserProfile;
        await setDoc(
            userRef,
            {
                displayName,
                photoURL,
                gamesPlayed: increment(1),
                gamesWon: increment(won ? 1 : 0),
                totalScore: increment(gameScore),
                highestRoundScore: Math.max(
                    existing.highestRoundScore,
                    highestRound
                ),
            },
            { merge: true }
        );
    }
}

/**
 * Fetches the all-time leaderboard sorted by total wins (then total score).
 */
export async function getLeaderboard(
    count: number = 50
): Promise<UserProfile[]> {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("gamesWon", "desc"), limit(count));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
    })) as UserProfile[];
}
