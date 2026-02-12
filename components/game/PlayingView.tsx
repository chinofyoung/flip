"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2,
    Hand,
    Lock,
    ChevronUp,
    ChevronDown,
    Crown,
} from "lucide-react";
import RoomHeader from "@/components/game/RoomHeader";
import ScoreBoard from "@/components/game/ScoreBoard";
import PlayerHand from "@/components/game/PlayerHand";
import CardPicker from "@/components/game/CardPicker";
import ActionCardModal from "@/components/game/ActionCardModal";
import PlayerAvatar from "@/components/ui/PlayerAvatar";
import type {
    Room,
    Round,
    Card,
    RoundSummary,
} from "@/lib/firestore-schema";

interface PlayingViewProps {
    code: string;
    room: Room;
    round: Round | null;
    user: any; // User context object
    cumulativeScores: Record<string, number>;
    myHand: any;
    isMyTurnActive: boolean;
    isProcessing: boolean;
    isHost: boolean;
    actionModal: { type: "flip-three" | "freeze" | "second-chance-pass"; sourcePlayerId: string } | null;
    onCardSelect: (card: Card) => void;
    onRemoveCard: (cardId: string) => void;
    onStay: () => void;
    onFlipThreeTarget: (targetId: string) => void;
    onFreezeTarget: (targetId: string) => void;
    onSecondChancePass: (targetId: string) => void;
    onEndRound: () => void;
    onLeave: () => void;
    onHideActionModal: () => void;
}

export default function PlayingView({
    code,
    room,
    round,
    user,
    cumulativeScores,
    myHand,
    isMyTurnActive,
    isProcessing,
    isHost,
    actionModal,
    onCardSelect,
    onRemoveCard,
    onStay,
    onFlipThreeTarget,
    onFreezeTarget,
    onSecondChancePass,
    onEndRound,
    onLeave,
    onHideActionModal,
}: PlayingViewProps) {
    const [isCardPickerOpen, setIsCardPickerOpen] = useState(true);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <RoomHeader
                code={code}
                playerCount={room.players.length}
                onEndRound={isHost ? onEndRound : undefined}
                onLeave={onLeave}
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
                        onRemoveCard={onRemoveCard}
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

                            <div className="flex gap-4">
                                <motion.button
                                    type="button"
                                    onClick={onStay}
                                    disabled={
                                        isProcessing ||
                                        (myHand?.cards.length || 0) === 0 ||
                                        (myHand?.pendingFlipThree || 0) > 0
                                    }
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
                                        {(myHand?.pendingFlipThree || 0) > 0
                                            ? "Forced Reveal"
                                            : "Next Move"}
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
                                            onCardSelect={onCardSelect}
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
                            ? onFlipThreeTarget
                            : actionModal.type === "freeze"
                                ? onFreezeTarget
                                : onSecondChancePass
                    }
                    onCancel={onHideActionModal}
                />
            )}
        </div>
    );
}
