"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Loader2, Hand, Square, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { hapticMedium, hapticHeavy } from "@/lib/haptics";
import { AuthGuard } from "@/components/AuthGuard";
import RoomHeader from "@/components/game/RoomHeader";
import CardPicker from "@/components/game/CardPicker";
import PlayerHand from "@/components/game/PlayerHand";
import ScoreBoard from "@/components/game/ScoreBoard";
import ActionCardModal from "@/components/game/ActionCardModal";
import RoundSummary from "@/components/game/RoundSummary";
import GameOverScreen from "@/components/game/GameOverScreen";
import {
  joinRoom,
  leaveRoom,
  startGame,
  subscribeToRoom,
  getRoomByCode,
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
import type { Room, RoomPlayer, Round, Card, RoundSummary as RoundSummaryType } from "@/lib/firestore-schema";

function RoomContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const code = params.code as string;

  // Local UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCardPickerOpen, setIsCardPickerOpen] = useState(true);
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
  const [roundSummaries, setRoundSummaries] = useState<RoundSummaryType[]>([]);

  // Derived state
  const isUserInRoom = room?.players.some((p) => p.uid === user?.uid) ?? false;
  const isHost = room?.hostId === user?.uid;
  const canStartGame = isHost && (room?.players.length ?? 0) >= 2;
  const myHand = round?.playerHands[user?.uid || ""];
  const isMyTurnActive = myHand?.status === "active";

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

      // Sync cumulative scores from room document (all clients)
      if (updatedRoom.cumulativeScores) {
        setCumulativeScores(updatedRoom.cumulativeScores);
      }

      // Game just started — only host initializes round (avoids race)
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

      // New round started by host advancing — only host initializes
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
  }, [room?.id, router, setRoom, setGamePhase]);

  // --- Subscribe to round updates ---
  useEffect(() => {
    if (!room?.id || !room.currentRound || room.status !== "playing") return;

    const unsubscribe = subscribeToRound(
      room.id,
      room.currentRound,
      (roundData) => {
        if (!roundData) return;
        setRound(roundData);

        // Check if round completed
        if (roundData.isComplete && gamePhase === "playing") {
          setGamePhase("round-end");
        }
      }
    );

    return () => unsubscribe();
  }, [room?.id, room?.currentRound, room?.status, setRound, setGamePhase, gamePhase]);

  // --- Card selection handler ---
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
          showActionModal({ type: "second-chance-pass", sourcePlayerId: user.uid });
        }

        // Check if round should end
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

  // --- Remove card handler ---
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

  // --- Stay handler ---
  const handleStay = useCallback(async () => {
    if (!room || !user || isProcessing) return;
    if (myHand?.status !== "active") return;

    setIsProcessing(true);
    try {
      await playerStay(room.id, room.currentRound, user.uid);
      hapticMedium();
      toast.success("You stayed!");
      await checkAndEndRound(room.id, room.currentRound);
    } catch (err) {
      console.error("Error staying:", err);
      toast.error("Failed to stay");
    } finally {
      setIsProcessing(false);
    }
  }, [room, user, isProcessing, myHand]);

  // --- Action modal handlers ---
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
        const targetName = room.players.find((p) => p.uid === targetPlayerId)?.displayName;
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
        const targetName = room.players.find((p) => p.uid === targetPlayerId)?.displayName;
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
        const targetName = room.players.find((p) => p.uid === targetPlayerId)?.displayName;
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

  // --- End round / next round ---
  const handleNextRound = useCallback(async () => {
    if (!room || !user || !isHost || !round) return;

    try {
      // Save round summary
      const roundScores: Record<string, number> = {};
      const roundHands: Record<string, Card[]> = {};
      for (const [uid, hand] of Object.entries(round.playerHands)) {
        roundScores[uid] = hand.status === "busted" ? 0 : hand.score;
        roundHands[uid] = hand.cards;
      }

      setRoundSummaries((prev) => [
        ...prev,
        {
          roundNumber: room.currentRound,
          scores: roundScores,
          hands: roundHands,
        },
      ]);

      const result = await endRoundAndAdvance(room.id, room.currentRound);
      setCumulativeScores(result.cumulativeScores);

      if (result.gameOver) {
        setGamePhase("game-over");

        // Save game result
        try {
          await saveGameResult(
            room,
            result.cumulativeScores,
            [
              ...roundSummaries,
              {
                roundNumber: room.currentRound,
                scores: roundScores,
                hands: roundHands,
              },
            ]
          );
        } catch (saveErr) {
          console.error("Error saving game result:", saveErr);
        }
      }
    } catch (err) {
      console.error("Error advancing round:", err);
      toast.error("Failed to advance to next round");
    }
  }, [room, user, isHost, round, roundSummaries, setCumulativeScores, setGamePhase]);

  // --- Start game ---
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

  // --- Force end round (host only) ---
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

  // --- Leave room ---
  const handleLeaveRoom = async () => {
    if (!room || !user) return;

    const isPlaying = room.status !== "waiting";

    if (isPlaying) {
      if (!confirm("Leave the game? You can return later using the room code.")) return;
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

  // --- Play Again ---
  const handlePlayAgain = async () => {
    if (!room || !user) return;

    // Reset game state and go back to home to create new room
    reset();
    router.push("/");
  };

  // --- Loading ---
  if (isLoading || isJoining) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-foreground text-lg">
            {isJoining ? "Joining room..." : "Loading room..."}
          </p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error || !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-3xl font-bold text-gold mb-4">
            {error || "Room not found"}
          </h1>
          <p className="text-muted mb-6">
            {error === "Game already in progress"
              ? "This game has already started. Please create or join another room."
              : "The room you're looking for doesn't exist or has been closed."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gold text-background font-semibold rounded-lg hover:bg-gold/90 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // --- Game Over ---
  if (gamePhase === "game-over") {
    return (
      <GameOverScreen
        room={room}
        cumulativeScores={cumulativeScores}
        currentUserId={user?.uid || ""}
        onPlayAgain={handlePlayAgain}
        onExit={() => {
          reset();
          router.push("/");
        }}
      />
    );
  }

  // --- Round Summary ---
  if (gamePhase === "round-end" && round) {
    return (
      <div className="min-h-screen bg-background">
        <RoomHeader
          code={code}
          playerCount={room.players.length}
          onLeave={handleLeaveRoom}
        />
        <div className="max-w-lg mx-auto px-4 py-8">
          <RoundSummary
            room={room}
            round={round}
            cumulativeScores={cumulativeScores}
            roundNumber={room.currentRound}
            onNextRound={handleNextRound}
            isHost={isHost}
          />
        </div>
      </div>
    );
  }

  // --- Playing ---
  if (room.status === "playing" && gamePhase === "playing") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <RoomHeader
          code={code}
          playerCount={room.players.length}
          onEndRound={isHost ? handleEndRound : undefined}
          onLeave={handleLeaveRoom}
        />

        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-4 gap-4 overflow-hidden">
          {/* Scoreboard */}
          <ScoreBoard
            room={room}
            round={round}
            cumulativeScores={cumulativeScores}
            currentUserId={user?.uid || ""}
          />

          {/* My Hand */}
          <div className="bg-surface rounded-xl border border-muted/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                Your Hand
              </h3>
              {myHand?.status === "active" && (
                <span className="text-xs text-emerald animate-pulse">
                  ● Active
                </span>
              )}
            </div>

            <PlayerHand
              cards={myHand?.cards || []}
              hasSecondChance={myHand?.hasSecondChance || false}
              status={myHand?.status || "active"}
              onRemoveCard={handleRemoveCard}
              isOwnHand
            />

            {/* Hit / Stay buttons */}
            {isMyTurnActive && (
              <div className="space-y-3 mt-4">
                {(myHand?.pendingFlipThree || 0) > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                      <span className="text-sm font-medium text-red-400">
                        Must draw {myHand?.pendingFlipThree} more cards
                      </span>
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={handleStay}
                    disabled={isProcessing || (myHand?.cards.length || 0) === 0 || (myHand?.pendingFlipThree || 0) > 0}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-3 bg-emerald/20 text-emerald font-semibold rounded-lg border border-emerald/30 hover:bg-emerald/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stay
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Card Picker (collapsible) */}
          {isMyTurnActive && (
            <div className="bg-surface rounded-xl border border-muted/20 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsCardPickerOpen(!isCardPickerOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-background/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Hand className="w-4 h-4 text-gold" />
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {(myHand?.pendingFlipThree || 0) > 0 ? "Forced Draw" : "Draw Card"}
                  </span>
                </div>
                {isCardPickerOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted" />
                )}
              </button>

              <AnimatePresence>
                {isCardPickerOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <CardPicker
                        onCardSelect={handleCardSelect}
                        disabled={isProcessing}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Other Players' Hands */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
              Other Players
            </h3>
            {room.players
              .filter((p) => p.uid !== user?.uid)
              .map((player) => {
                const playerHand = round?.playerHands[player.uid];
                return (
                  <div
                    key={player.uid}
                    className="bg-surface rounded-xl border border-muted/10 p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center">
                        {player.photoURL ? (
                          <img
                            src={player.photoURL}
                            alt=""
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-foreground">
                            {player.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {player.displayName}
                      </span>
                      {player.uid === room.hostId && (
                        <Crown className="w-3 h-3 text-gold" />
                      )}
                    </div>

                    <PlayerHand
                      cards={playerHand?.cards || []}
                      hasSecondChance={playerHand?.hasSecondChance || false}
                      status={playerHand?.status || "active"}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action Card Modal */}
        {actionModal && (
          <ActionCardModal
            type={actionModal.type}
            players={room.players}
            currentUserId={user?.uid || ""}
            onSelectPlayer={
              actionModal.type === "flip-three"
                ? handleFlipThreeTarget
                : actionModal.type === "freeze"
                  ? handleFreezeTarget
                  : handleSecondChancePass
            }
            onCancel={hideActionModal}
          />
        )}
      </div>
    );
  }

  // --- Lobby (waiting) ---
  return (
    <div className="min-h-screen bg-background">
      <RoomHeader
        code={code}
        playerCount={room.players.length}
        onLeave={handleLeaveRoom}
      />

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-surface rounded-xl border border-muted/20 p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Waiting for players...
          </h2>

          {/* Player List */}
          <div className="space-y-3 mb-8">
            <AnimatePresence mode="popLayout">
              {room.players.map((player) => (
                <motion.div
                  key={player.uid}
                  layoutId={player.uid}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 p-4 bg-background rounded-lg border border-muted/20"
                >
                  {player.photoURL ? (
                    <img
                      src={player.photoURL}
                      alt={player.displayName}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                      <span className="text-gold font-semibold">
                        {player.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">
                        {player.displayName}
                      </span>
                      {player.uid === room.hostId && (
                        <Crown className="w-4 h-4 text-gold fill-gold" />
                      )}
                    </div>
                  </div>

                  {player.uid === user?.uid && (
                    <span className="text-emerald text-sm">You</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={handleStartGame}
                disabled={!canStartGame || isStarting}
                className="w-full px-6 py-4 bg-gold text-background font-bold text-lg rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Game"
                )}
              </button>

              {!canStartGame && (
                <p className="text-center text-muted text-sm">
                  Need at least 2 players to start
                </p>
              )}
            </div>
          )}

          {/* Leave Room Button */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            disabled={isLeaving}
            className="w-full px-6 py-3 text-muted hover:text-foreground border border-muted/20 hover:border-muted/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLeaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Leaving...
              </>
            ) : (
              "Leave Room"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <AuthGuard>
      <RoomContent />
    </AuthGuard>
  );
}
