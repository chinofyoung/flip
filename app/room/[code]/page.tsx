"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Loader2, Hand, Lock, ChevronUp, ChevronDown } from "lucide-react";
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
  updateTargetScore,
  updateShowPlayerCards,
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
      toast.success("Locked in!");
      await checkAndEndRound(room.id, room.currentRound);
    } catch (err) {
      console.error("Error locking in:", err);
      toast.error("Failed to lock in");
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

  const handleUpdateTargetScore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!room || !user || !isHost) return;
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) return;

    try {
      await updateTargetScore(room.id, user.uid, value);
    } catch (err) {
      console.error("Error updating target score:", err);
    }
  };

  const handleShowPlayerCardsToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!room || !user || !isHost) return;
    try {
      await updateShowPlayerCards(room.id, user.uid, e.target.checked);
      toast.success(`Card visibility ${e.target.checked ? "enabled" : "disabled"}`);
    } catch (err) {
      console.error("Error updating card visibility:", err);
      toast.error("Failed to update card visibility");
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
              showPlayerCards={room.showPlayerCards}
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

                <div className="flex gap-4">
                  <motion.button
                    type="button"
                    onClick={handleStay}
                    disabled={isProcessing || (myHand?.cards.length || 0) === 0 || (myHand?.pendingFlipThree || 0) > 0}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-4 bg-emerald text-background font-black text-lg rounded-2xl shadow-xl shadow-emerald/10 overflow-hidden uppercase tracking-tighter italic disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      Lock In
                    </span>
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Card Picker (collapsible) */}
          {isMyTurnActive && (
            <div className="bg-black/40 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
              <button
                type="button"
                onClick={() => setIsCardPickerOpen(!isCardPickerOpen)}
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Hand className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-muted/40 uppercase tracking-[0.2em] block leading-none">
                      Select Your
                    </span>
                    <span className="text-sm font-black text-foreground uppercase tracking-tight mt-0.5 block">
                      {(myHand?.pendingFlipThree || 0) > 0 ? "Forced Reveal" : "Next Move"}
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  {isCardPickerOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted/40" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted/40" />
                  )}
                </div>
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
                      showPlayerCards={room.showPlayerCards}
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

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Crown className="w-32 h-32" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald animate-pulse shadow-[0_0_8px_rgba(45,212,160,0.8)]" />
              <h2 className="text-[10px] font-black text-muted/60 uppercase tracking-[0.3em]">
                Gathering the Squad
              </h2>
            </div>

            {/* Target Score Selection */}
            <div className="mb-12 bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted/40 uppercase tracking-widest leading-none mb-1.5">
                  Winning Points
                </span>
                <span className="text-sm font-black text-foreground uppercase tracking-tight">
                  Threshold
                </span>
              </div>

              {isHost ? (
                <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                  <input
                    type="number"
                    value={room.targetScore ?? 200}
                    onChange={handleUpdateTargetScore}
                    min="1"
                    className="w-16 bg-transparent border-none text-gold font-black font-mono text-xl focus:outline-none text-right"
                  />
                  <span className="text-[10px] font-black text-gold/40 uppercase tracking-widest">Pts</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black font-mono text-gold italic">
                    {room.targetScore}
                  </span>
                  <span className="text-[10px] font-black text-gold/40 uppercase tracking-widest mt-1">Pts</span>
                </div>
              )}
            </div>

            {/* Card Visibility Toggle */}
            <div className="mb-8 bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted/40 uppercase tracking-widest leading-none mb-1.5">
                  Privacy Setting
                </span>
                <span className="text-sm font-black text-foreground uppercase tracking-tight">
                  Show Player Cards
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={room.showPlayerCards ?? false}
                  onChange={handleShowPlayerCardsToggle}
                  disabled={!isHost}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
              </label>
            </div>

            {/* Player List */}
            <div className="grid grid-cols-1 gap-3 mb-12">
              <AnimatePresence mode="popLayout">
                {room.players.map((player, index) => (
                  <motion.div
                    key={player.uid}
                    layoutId={player.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all"
                  >
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt={player.displayName}
                        className="w-12 h-12 rounded-full border-2 border-white/5 shadow-lg shadow-black/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shadow-lg shadow-black/20">
                        <span className="text-gold font-black text-lg">
                          {player.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <span className="text-sm font-black text-foreground uppercase tracking-tight block">
                        {player.displayName}
                      </span>
                      <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest leading-none">
                        {player.uid === room.hostId ? "Room Host" : "Ready Player"}
                      </span>
                    </div>

                    {player.uid === room.hostId && (
                      <Crown className="w-4 h-4 text-gold drop-shadow-[0_0_8px_rgba(212,168,67,0.5)]" />
                    )}

                    {player.uid === user?.uid && (
                      <span className="text-[10px] font-black text-emerald/40 uppercase tracking-widest">You</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Start Game Button (host only) */}
            {isHost && (
              <div className="space-y-4">
                <motion.button
                  type="button"
                  onClick={handleStartGame}
                  disabled={isStarting || room.players.length < 2}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full py-5 bg-gold text-background font-black text-xl rounded-2xl shadow-2xl shadow-gold/20 overflow-hidden uppercase tracking-tighter italic disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isStarting ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      "Ignite the Round"
                    )}
                  </span>
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>

                {room.players.length < 2 && (
                  <p className="text-center text-muted/40 text-[10px] font-black uppercase tracking-widest">
                    Need 2+ players to start
                  </p>
                )}
              </div>
            )}

            {!isHost && (
              <div className="bg-gold/5 border border-gold/20 rounded-2xl p-6 text-center">
                <p className="text-gold font-black uppercase tracking-tighter italic text-lg leading-tight">
                  Hold tight.
                </p>
                <p className="text-muted/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                  The host prepares the deck
                </p>
              </div>
            )}
          </div>
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
