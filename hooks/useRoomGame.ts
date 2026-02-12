"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { hapticMedium } from "@/lib/haptics";
import {
    joinRoom,
    leaveRoom,
    startGame,
    subscribeToRoom,
    getRoomByCode,
    updateTargetScore,
} from "@/lib/room-service";
import {
    initializeRound,
    addCardToHand,
    removeCardFromHand,
    playerStay,
    triggerFlipThree,
    applyFreezeToPlayer,
    passSecondChance,
    checkAndEndRound,
    forceEndRound,
    endRoundAndAdvance,
    subscribeToRound,
    saveGameResult,
} from "@/lib/game-service";
import { useGameStore } from "@/lib/stores/game-store";
import type { RoomPlayer, Card, RoundSummary } from "@/lib/firestore-schema";

export function useRoomGame(code: string) {
    const router = useRouter();
    const { user } = useAuth();

    // Local UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Game store
    const {
        room,
        round,
        gamePhase,
        cumulativeScores,
        actionModal,
        setRoom,
        setRound,
        setGamePhase,
        setCumulativeScores,
        showActionModal,
        hideActionModal,
        reset,
    } = useGameStore();

    // Track round history for game save
    const [roundSummaries, setRoundSummaries] = useState<RoundSummary[]>([]);

    // Derived state (memoized)
    const isUserInRoom = useMemo(
        () => room?.players.some((p) => p.uid === user?.uid) ?? false,
        [room?.players, user?.uid]
    );
    const isHost = useMemo(
        () => room?.hostId === user?.uid,
        [room?.hostId, user?.uid]
    );
    const canStartGame = useMemo(
        () => isHost && (room?.players.length ?? 0) >= 2,
        [isHost, room?.players.length]
    );
    const myHand = useMemo(
        () => round?.playerHands[user?.uid || ""],
        [round?.playerHands, user?.uid]
    );
    const isMyTurnActive = useMemo(
        () => myHand?.status === "active",
        [myHand?.status]
    );

    // --- Room initialization & auto-join ---
    useEffect(() => {
        if (!user || !code) return;
        let isMounted = true;

        const initializeRoom = async () => {
            try {
                if (!isMounted) return;
                setIsLoading(true);
                const foundRoom = await getRoomByCode(code);

                if (!isMounted) return;
                if (!foundRoom) {
                    setError("Room not found");
                    setIsLoading(false);
                    return;
                }

                const userInRoom = foundRoom.players.some((p) => p.uid === user.uid);

                if (!userInRoom) {
                    if (foundRoom.status !== "waiting") {
                        if (!isMounted) return;
                        setError("Game already in progress");
                        setIsLoading(false);
                        return;
                    }

                    if (!isMounted) return;
                    setIsJoining(true);
                    const playerData: RoomPlayer = {
                        uid: user.uid,
                        displayName: user.displayName || "Guest",
                        photoURL: user.photoURL || null,
                        joinedAt: Date.now(),
                    };

                    await joinRoom(code, playerData);
                    if (!isMounted) return;
                    toast.success("Joined room!");
                }

                if (!isMounted) return;
                setRoom(foundRoom);
                setIsLoading(false);
                setIsJoining(false);
            } catch (err) {
                console.error("Error initializing room:", err);
                if (!isMounted) return;
                toast.error("Failed to join room");
                setError("Failed to join room");
                setIsLoading(false);
                setIsJoining(false);
            }
        };

        initializeRoom();
        return () => {
            isMounted = false;
        };
    }, [user, code, setRoom]);

    // --- Subscribe to room updates ---
    useEffect(() => {
        if (!room?.id) return;

        const unsubscribe = subscribeToRoom(room.id, (updatedRoom) => {
            if (!updatedRoom) {
                toast.error("Room has been closed");
                router.push("/");
                return;
            }

            const previousRoom = useGameStore.getState().room;
            setRoom(updatedRoom);

            if (updatedRoom.cumulativeScores) {
                setCumulativeScores(updatedRoom.cumulativeScores);
            }

            if (
                updatedRoom.status === "playing" &&
                previousRoom?.status === "waiting"
            ) {
                toast.success("Game starting!");
                if (updatedRoom.hostId === user?.uid) {
                    const playerUids = updatedRoom.players.map((p) => p.uid);
                    initializeRound(updatedRoom.id, 1, playerUids).catch(console.error);
                }
            }

            if (
                updatedRoom.status === "playing" &&
                previousRoom?.status === "playing" &&
                updatedRoom.currentRound > (previousRoom?.currentRound || 0)
            ) {
                if (updatedRoom.hostId === user?.uid) {
                    const playerUids = updatedRoom.players.map((p) => p.uid);
                    initializeRound(
                        updatedRoom.id,
                        updatedRoom.currentRound,
                        playerUids
                    ).catch(console.error);
                }
                setGamePhase("playing");
            }
        });

        return () => unsubscribe();
    }, [room?.id, user?.uid, router, setRoom, setGamePhase, setCumulativeScores]);

    // --- Subscribe to round updates ---
    useEffect(() => {
        if (!room?.id || !room.currentRound || room.status !== "playing") return;

        const unsubscribe = subscribeToRound(
            room.id,
            room.currentRound,
            (roundData) => {
                if (!roundData) return;
                setRound(roundData);

                if (roundData.isComplete && gamePhase === "playing") {
                    setGamePhase("round-end");
                }
            }
        );

        return () => unsubscribe();
    }, [
        room?.id,
        room?.currentRound,
        room?.status,
        setRound,
        setGamePhase,
        gamePhase,
    ]);

    // --- Handlers ---
    const handleCardSelect = useCallback(
        async (card: Card) => {
            if (!room || !user || !round || isProcessing) return;
            if (myHand?.status !== "active") return;

            setIsProcessing(true);
            try {
                const result = await addCardToHand(
                    room.id,
                    room.currentRound,
                    user.uid,
                    card
                );

                if (result.actionRequired === "flip-three") {
                    showActionModal({ type: "flip-three", sourcePlayerId: user.uid });
                } else if (result.actionRequired === "freeze") {
                    showActionModal({ type: "freeze", sourcePlayerId: user.uid });
                } else if (result.actionRequired === "second-chance-pass") {
                    showActionModal({
                        type: "second-chance-pass",
                        sourcePlayerId: user.uid,
                    });
                }

                await checkAndEndRound(room.id, room.currentRound);
            } catch (err) {
                console.error("Error adding card:", err);
                toast.error("Failed to add card");
            } finally {
                setIsProcessing(false);
            }
        },
        [room, user, round, isProcessing, myHand, showActionModal]
    );

    const handleRemoveCard = useCallback(
        async (cardId: string) => {
            if (!room || !user || isProcessing) return;

            setIsProcessing(true);
            try {
                await removeCardFromHand(room.id, room.currentRound, user.uid, cardId);
            } catch (err) {
                console.error("Error removing card:", err);
                toast.error("Failed to remove card");
            } finally {
                setIsProcessing(false);
            }
        },
        [room, user, isProcessing]
    );

    const handleStay = useCallback(async () => {
        if (!room || !user || isProcessing) return;
        if (myHand?.status !== "active") return;

        setIsProcessing(true);
        try {
            await playerStay(room.id, room.currentRound, user.uid);
            hapticMedium();
            toast.success("Locked in!");
            await checkAndEndRound(room.id, room.currentRound);
        } catch (err) {
            console.error("Error locking in:", err);
            toast.error("Failed to lock in");
        } finally {
            setIsProcessing(false);
        }
    }, [room, user, isProcessing, myHand]);

    const handleFlipThreeTarget = useCallback(
        async (targetPlayerId: string) => {
            if (!room || !user) return;
            hideActionModal();

            try {
                await triggerFlipThree(
                    room.id,
                    room.currentRound,
                    user.uid,
                    targetPlayerId
                );
                const targetName = room.players.find(
                    (p) => p.uid === targetPlayerId
                )?.displayName;
                toast.info(
                    targetPlayerId === user.uid
                        ? "You have to draw 3 cards!"
                        : `Flip Three applied to ${targetName}!`
                );
            } catch (err) {
                console.error("Error triggering Flip Three:", err);
                toast.error("Failed to apply Flip Three");
            }
        },
        [room, user, hideActionModal]
    );

    const handleFreezeTarget = useCallback(
        async (targetPlayerId: string) => {
            if (!room || !user) return;
            hideActionModal();

            try {
                await applyFreezeToPlayer(
                    room.id,
                    room.currentRound,
                    user.uid,
                    targetPlayerId
                );
                const targetName = room.players.find(
                    (p) => p.uid === targetPlayerId
                )?.displayName;
                toast.success(
                    targetPlayerId === user.uid
                        ? "You froze yourself!"
                        : `Froze ${targetName}!`
                );
                await checkAndEndRound(room.id, room.currentRound);
            } catch (err) {
                console.error("Error applying freeze:", err);
                toast.error("Failed to apply freeze");
            }
        },
        [room, user, hideActionModal]
    );

    const handleSecondChancePass = useCallback(
        async (targetPlayerId: string) => {
            if (!room || !user) return;
            hideActionModal();

            try {
                await passSecondChance(
                    room.id,
                    room.currentRound,
                    user.uid,
                    targetPlayerId
                );
                const targetName = room.players.find(
                    (p) => p.uid === targetPlayerId
                )?.displayName;
                toast.success(
                    targetPlayerId === user.uid
                        ? "Second Chance applied to yourself!"
                        : `Second Chance passed to ${targetName}`
                );
            } catch (err) {
                console.error("Error passing second chance:", err);
                toast.error("Failed to pass Second Chance");
            }
        },
        [room, user, hideActionModal]
    );

    const handleNextRound = useCallback(async () => {
        if (!room || !user || !isHost || !round) return;

        try {
            const roundScores: Record<string, number> = {};
            const roundHands: Record<string, Card[]> = {};
            for (const [uid, hand] of Object.entries(round.playerHands)) {
                roundScores[uid] = hand.status === "busted" ? 0 : hand.score;
                roundHands[uid] = hand.cards;
            }

            const newSummary = {
                roundNumber: room.currentRound,
                scores: roundScores,
                hands: roundHands,
            };

            setRoundSummaries((prev) => [...prev, newSummary]);

            // Calculate new round summaries including this one for the game record
            const allRoundSummaries = [...roundSummaries, newSummary];

            const result = await endRoundAndAdvance(room.id, room.currentRound);
            setCumulativeScores(result.cumulativeScores);

            if (result.gameOver) {
                setGamePhase("game-over");
                try {
                    await saveGameResult(
                        room,
                        result.cumulativeScores,
                        allRoundSummaries
                    );
                } catch (saveErr) {
                    console.error("Error saving game result:", saveErr);
                }
            }
        } catch (err) {
            console.error("Error advancing round:", err);
            toast.error("Failed to advance to next round");
        }
    }, [
        room,
        user,
        isHost,
        round,
        roundSummaries,
        setCumulativeScores,
        setGamePhase,
    ]);

    const handleStartGame = async () => {
        if (!room || !user || !isHost) return;

        try {
            setIsStarting(true);
            await startGame(room.id, user.uid);
            toast.success("Starting game...");
        } catch (err) {
            console.error("Error starting game:", err);
            toast.error("Failed to start game");
            setIsStarting(false);
        }
    };

    const handleUpdateTargetScore = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!room || !user || !isHost) return;
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) return;

        try {
            await updateTargetScore(room.id, user.uid, value);
        } catch (err) {
            console.error("Error updating target score:", err);
        }
    };

    const handleEndRound = async () => {
        if (!room || !user || !isHost) return;
        if (!confirm("Are you sure you want to end this round for everyone?")) return;

        try {
            await forceEndRound(room.id, room.currentRound);
            toast.success("Round ended by host");
        } catch (err) {
            console.error("Error ending round:", err);
            toast.error("Failed to end round");
        }
    };

    const handleLeaveRoom = async () => {
        if (!room || !user) return;
        const isPlaying = room.status !== "waiting";

        if (isPlaying) {
            if (
                !confirm(
                    "Leave the game? You can return later using the room code."
                )
            )
                return;
            reset();
            router.push("/");
            return;
        }

        try {
            setIsLeaving(true);
            await leaveRoom(room.id, user.uid);
            reset();
            toast.success("Left room");
            router.push("/");
        } catch (err) {
            console.error("Error leaving room:", err);
            toast.error("Failed to leave room");
            setIsLeaving(false);
        }
    };

    const handlePlayAgain = async () => {
        if (!room || !user) return;
        reset();
        router.push("/");
    };

    return {
        room,
        round,
        gamePhase,
        cumulativeScores,
        actionModal,
        isLoading,
        isJoining,
        isStarting,
        isLeaving,
        error,
        isProcessing,
        user,
        // Derived
        isUserInRoom,
        isHost,
        canStartGame,
        myHand,
        isMyTurnActive,
        // Handlers
        handlers: {
            handleCardSelect,
            handleRemoveCard,
            handleStay,
            handleFlipThreeTarget,
            handleFreezeTarget,
            handleSecondChancePass,
            handleNextRound,
            handleStartGame,
            handleUpdateTargetScore,
            handleEndRound,
            handleLeaveRoom,
            handlePlayAgain,
            hideActionModal,
        },
    };
}
