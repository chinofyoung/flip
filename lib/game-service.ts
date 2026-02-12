import {
    doc,
    collection,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
    Room,
    Round,
    PlayerHand,
    Card,
    PlayerStatus,
    GameRecord,
    RoundSummary,
} from "@/lib/firestore-schema";
import { calculateScore, isBusted, hasFlipSeven } from "@/lib/game/scoring";
import { resolveCardDraw } from "@/lib/game/actions";

/**
 * Initializes a new round in the room.
 * Creates playerHands for each player with empty hands and active status.
 */
export async function initializeRound(
    roomId: string,
    roundNumber: number,
    playerUids: string[]
): Promise<void> {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    const playerHands: Record<string, PlayerHand> = {};
    for (const uid of playerUids) {
        playerHands[uid] = {
            cards: [],
            score: 0,
            status: "active",
            hasSecondChance: false,
        };
    }

    const roundData: Round = {
        roundNumber,
        playerHands,
        turnOrder: playerUids,
        currentTurnIndex: 0,
        isComplete: false,
    };

    await setDoc(roundRef, roundData);
}

/**
 * Adds a card to a player's hand in the current round.
 * The card's effects (bust, freeze, second chance, etc.) are resolved.
 * Returns the action required if any (e.g. Flip Three target selection).
 */
export async function addCardToHand(
    roomId: string,
    roundNumber: number,
    playerId: string,
    card: Card
): Promise<{ actionRequired: string | null }> {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    let actionRequired: string | null = null;

    await runTransaction(db, async (transaction) => {
        const roundSnapshot = await transaction.get(roundRef);

        if (!roundSnapshot.exists()) {
            throw new Error("Round not found");
        }

        const roundData = roundSnapshot.data() as Round;
        const currentHand = roundData.playerHands[playerId];

        if (!currentHand) {
            throw new Error("Player not found in this round");
        }

        if (currentHand.status !== "active") {
            throw new Error("Player cannot draw cards (not active)");
        }

        // Resolve the card draw using game actions logic
        const result = resolveCardDraw(currentHand, card);

        // Update the round with the new hand
        const updatedPlayerHands = {
            ...roundData.playerHands,
            [playerId]: result.hand,
        };

        transaction.update(roundRef, {
            playerHands: updatedPlayerHands,
        });

        if (result.actionRequired) {
            actionRequired = result.actionRequired.type;
        }
    });

    return { actionRequired };
}

/**
 * Removes a card from a player's hand (undo functionality).
 */
export async function removeCardFromHand(
    roomId: string,
    roundNumber: number,
    playerId: string,
    cardId: string
): Promise<void> {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    await runTransaction(db, async (transaction) => {
        const roundSnapshot = await transaction.get(roundRef);

        if (!roundSnapshot.exists()) {
            throw new Error("Round not found");
        }

        const roundData = roundSnapshot.data() as Round;
        const currentHand = roundData.playerHands[playerId];

        if (!currentHand) {
            throw new Error("Player not found in this round");
        }

        // Remove the card
        const updatedCards = currentHand.cards.filter((c) => c.id !== cardId);
        const newScore = calculateScore(updatedCards);
        const busted = isBusted(updatedCards);

        const updatedHand: PlayerHand = {
            ...currentHand,
            cards: updatedCards,
            score: newScore,
            status: busted ? "busted" : "active",
        };

        transaction.update(roundRef, {
            [`playerHands.${playerId}`]: updatedHand,
        });
    });
}

/**
 * Player chooses to stay, banking their current points.
 */
export async function playerStay(
    roomId: string,
    roundNumber: number,
    playerId: string
): Promise<void> {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    await runTransaction(db, async (transaction) => {
        const roundSnapshot = await transaction.get(roundRef);

        if (!roundSnapshot.exists()) {
            throw new Error("Round not found");
        }

        const roundData = roundSnapshot.data() as Round;
        const currentHand = roundData.playerHands[playerId];

        if (!currentHand) {
            throw new Error("Player not found in this round");
        }

        if (currentHand.status !== "active") {
            throw new Error("Player cannot stay (not active)");
        }

        const updatedHand: PlayerHand = {
            ...currentHand,
            status: "stayed",
        };

        transaction.update(roundRef, {
            [`playerHands.${playerId}`]: updatedHand,
        });
    });
}

/**
 * Applies Flip Three to a target player by drawing 3 cards for them.
 * The cards are provided by the caller (since physical cards are used).
 */
export async function applyFlipThree(
    roomId: string,
    roundNumber: number,
    targetPlayerId: string,
    cards: Card[]
): Promise<void> {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    await runTransaction(db, async (transaction) => {
        const roundSnapshot = await transaction.get(roundRef);

        if (!roundSnapshot.exists()) {
            throw new Error("Round not found");
        }

        const roundData = roundSnapshot.data() as Round;
        let currentHand = roundData.playerHands[targetPlayerId];

        if (!currentHand) {
            throw new Error("Target player not found");
        }

        // Apply each card one by one, resolving effects
        for (const card of cards) {
            if (currentHand.status !== "active") break;

            const result = resolveCardDraw(currentHand, card);
            currentHand = result.hand;
        }

        transaction.update(roundRef, {
            [`playerHands.${targetPlayerId}`]: currentHand,
        });
    });
}

/**
 * Passes a Second Chance card to another player.
 */
export async function passSecondChance(
    roomId: string,
    roundNumber: number,
    targetPlayerId: string
): Promise<void> {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    await runTransaction(db, async (transaction) => {
        const roundSnapshot = await transaction.get(roundRef);

        if (!roundSnapshot.exists()) {
            throw new Error("Round not found");
        }

        const roundData = roundSnapshot.data() as Round;
        const targetHand = roundData.playerHands[targetPlayerId];

        if (!targetHand) {
            throw new Error("Target player not found");
        }

        if (targetHand.hasSecondChance) {
            throw new Error("Target already has a Second Chance");
        }

        const updatedHand: PlayerHand = {
            ...targetHand,
            hasSecondChance: true,
        };

        transaction.update(roundRef, {
            [`playerHands.${targetPlayerId}`]: updatedHand,
        });
    });
}

/**
 * Checks if all players have finished (busted, stayed, or frozen).
 * If so, marks the round as complete.
 */
export async function checkAndEndRound(
    roomId: string,
    roundNumber: number
): Promise<boolean> {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    let roundEnded = false;

    await runTransaction(db, async (transaction) => {
        const roundSnapshot = await transaction.get(roundRef);

        if (!roundSnapshot.exists()) return;

        const roundData = roundSnapshot.data() as Round;

        // Check if all players are done
        const allDone = Object.values(roundData.playerHands).every(
            (hand) => hand.status !== "active"
        );

        // Check if any player achieved Flip 7
        const flipSevenPlayer = Object.entries(roundData.playerHands).find(
            ([, hand]) => hand.status === "active" && hasFlipSeven(hand.cards)
        );

        if (allDone || flipSevenPlayer) {
            transaction.update(roundRef, {
                isComplete: true,
            });
            roundEnded = true;
        }
    });

    return roundEnded;
}

/**
 * Ends the current round and starts the next one, or ends the game.
 * Returns cumulative scores for all players.
 */
export async function endRoundAndAdvance(
    roomId: string,
    roundNumber: number
): Promise<{ gameOver: boolean; cumulativeScores: Record<string, number> }> {
    const roomRef = doc(db, "rooms", roomId);

    let gameOver = false;
    let cumulativeScores: Record<string, number> = {};

    await runTransaction(db, async (transaction) => {
        const roomSnapshot = await transaction.get(roomRef);
        if (!roomSnapshot.exists()) throw new Error("Room not found");

        const roomData = roomSnapshot.data() as Omit<Room, "id">;

        // Read the current round
        const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());
        const roundSnapshot = await transaction.get(roundRef);

        if (!roundSnapshot.exists()) throw new Error("Round not found");
        const roundData = roundSnapshot.data() as Round;

        // Calculate round scores: busted players get 0
        const roundScores: Record<string, number> = {};
        for (const [uid, hand] of Object.entries(roundData.playerHands)) {
            roundScores[uid] = hand.status === "busted" ? 0 : hand.score;
        }

        // Read all previous rounds to calculate cumulative
        cumulativeScores = {};
        for (const player of roomData.players) {
            cumulativeScores[player.uid] = 0;
        }

        // Read previous rounds
        for (let r = 1; r < roundNumber; r++) {
            const prevRoundRef = doc(db, "rooms", roomId, "rounds", r.toString());
            const prevRoundSnapshot = await transaction.get(prevRoundRef);
            if (prevRoundSnapshot.exists()) {
                const prevRound = prevRoundSnapshot.data() as Round;
                for (const [uid, hand] of Object.entries(prevRound.playerHands)) {
                    if (cumulativeScores[uid] !== undefined) {
                        cumulativeScores[uid] += hand.status === "busted" ? 0 : hand.score;
                    }
                }
            }
        }

        // Add current round scores
        for (const [uid, score] of Object.entries(roundScores)) {
            if (cumulativeScores[uid] !== undefined) {
                cumulativeScores[uid] += score;
            }
        }

        // Check if any player reached the target score
        const targetScore = roomData.targetScore || 200;
        const winner = Object.entries(cumulativeScores).find(
            ([, score]) => score >= targetScore
        );

        if (winner) {
            gameOver = true;
            transaction.update(roomRef, {
                status: "finished",
            });
        } else {
            // Start next round
            const nextRound = roundNumber + 1;
            transaction.update(roomRef, {
                currentRound: nextRound,
            });
        }
    });

    return { gameOver, cumulativeScores };
}

/**
 * Subscribes to real-time round updates.
 */
export function subscribeToRound(
    roomId: string,
    roundNumber: number,
    callback: (round: Round | null) => void
): () => void {
    const roundRef = doc(db, "rooms", roomId, "rounds", roundNumber.toString());

    return onSnapshot(
        roundRef,
        (snapshot) => {
            if (!snapshot.exists()) {
                callback(null);
                return;
            }
            callback(snapshot.data() as Round);
        },
        (error) => {
            console.error("Error subscribing to round:", error);
            callback(null);
        }
    );
}

/**
 * Saves the completed game to the games collection for history/leaderboard.
 */
export async function saveGameResult(
    room: Room,
    cumulativeScores: Record<string, number>,
    roundSummaries: RoundSummary[]
): Promise<string> {
    const winnerId = Object.entries(cumulativeScores).reduce((a, b) =>
        a[1] > b[1] ? a : b
    )[0];

    const gameRef = doc(collection(db, "games"));
    const gameData: Omit<GameRecord, "id"> = {
        roomCode: room.code,
        players: room.players,
        rounds: roundSummaries,
        finalScores: cumulativeScores,
        winnerId,
        createdAt: Date.now(),
        duration: Date.now() - room.createdAt,
    };

    await setDoc(gameRef, gameData);
    return gameRef.id;
}
