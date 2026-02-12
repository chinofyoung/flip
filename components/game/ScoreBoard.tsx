"use client";

import { motion } from "framer-motion";
import { Crown, TrendingUp } from "lucide-react";
import type { Room, Round } from "@/lib/firestore-schema";

interface ScoreBoardProps {
    room: Room;
    round: Round | null;
    cumulativeScores: Record<string, number>;
    currentUserId: string;
}

export default function ScoreBoard({
    room,
    round,
    cumulativeScores,
    currentUserId,
}: ScoreBoardProps) {
    // Sort players by cumulative score (descending)
    const sortedPlayers = [...room.players].sort((a, b) => {
        const scoreA = cumulativeScores[a.uid] || 0;
        const scoreB = cumulativeScores[b.uid] || 0;
        return scoreB - scoreA;
    });

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Scoreboard
                </h3>
                <span className="text-xs text-muted">
                    Round {room.currentRound} · Target: {room.targetScore}
                </span>
            </div>

            <div className="space-y-1.5">
                {sortedPlayers.map((player, index) => {
                    const cumScore = cumulativeScores[player.uid] || 0;
                    const hand = round?.playerHands[player.uid];
                    const roundScore =
                        hand && hand.status !== "busted" ? hand.score : 0;
                    const isCurrentUser = player.uid === currentUserId;
                    const progress = Math.min(
                        (cumScore / (room.targetScore || 200)) * 100,
                        100
                    );

                    return (
                        <motion.div
                            key={player.uid}
                            layout
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isCurrentUser
                                    ? "bg-gold/10 border border-gold/20"
                                    : "bg-surface border border-muted/10"
                                }`}
                        >
                            {/* Rank */}
                            <span className="text-xs text-muted w-4 text-center font-mono">
                                {index + 1}
                            </span>

                            {/* Avatar */}
                            <div className="w-7 h-7 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
                                {player.photoURL ? (
                                    <img
                                        src={player.photoURL}
                                        alt=""
                                        className="w-7 h-7 rounded-full"
                                    />
                                ) : (
                                    <span className="text-xs font-semibold text-foreground">
                                        {player.displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Name + Status */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`text-sm font-medium truncate ${isCurrentUser ? "text-gold" : "text-foreground"
                                            }`}
                                    >
                                        {player.displayName}
                                    </span>
                                    {player.uid === room.hostId && (
                                        <Crown className="w-3 h-3 text-gold shrink-0" />
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="mt-1 h-1 rounded-full bg-muted/20 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald to-gold"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {/* Round Score */}
                            {hand && (
                                <div className="text-right shrink-0">
                                    <span
                                        className={`text-xs ${hand.status === "busted"
                                                ? "text-red-400"
                                                : hand.status === "stayed" || hand.status === "frozen"
                                                    ? "text-emerald"
                                                    : "text-muted"
                                            }`}
                                    >
                                        {hand.status === "busted" ? "💥" : `+${roundScore}`}
                                    </span>
                                </div>
                            )}

                            {/* Cumulative Score */}
                            <motion.span
                                key={cumScore}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="font-bold font-mono text-sm text-foreground w-10 text-right"
                            >
                                {cumScore}
                            </motion.span>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
