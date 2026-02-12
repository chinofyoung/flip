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
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-black/40 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(212,168,67,0.8)]" />
                    <h3 className="text-[10px] font-black text-muted/60 uppercase tracking-[0.2em]">
                        Standings
                    </h3>
                </div>
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest">
                    Round {room.currentRound} <span className="text-muted/40 px-1">/</span> Target {room.targetScore}
                </span>
            </div>

            <div className="space-y-2">
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
                            className={`flex flex-col gap-2 p-3 rounded-2xl transition-all border ${isCurrentUser
                                ? "bg-gold/5 border-gold/20 shadow-lg shadow-gold/5"
                                : "bg-surface/50 border-white/5 shadow-md"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Rank */}
                                <span className="text-[10px] font-black text-muted/20 w-4 text-center">
                                    {String(index + 1).padStart(2, '0')}
                                </span>

                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                    {player.photoURL ? (
                                        <img
                                            src={player.photoURL}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs font-black text-foreground/40">
                                            {player.displayName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Name + Status */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 leading-tight">
                                        <span
                                            className={`text-xs font-black uppercase tracking-tight truncate ${isCurrentUser ? "text-gold" : "text-foreground"
                                                }`}
                                        >
                                            {player.displayName}
                                        </span>
                                        {player.uid === room.hostId && (
                                            <Crown className="w-2.5 h-2.5 text-gold/60 shrink-0" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-0.5">
                                        {hand && (
                                            <span
                                                className={`text-[9px] font-black uppercase tracking-widest ${hand.status === "busted"
                                                    ? "text-red-500/50"
                                                    : hand.status === "stayed" || hand.status === "frozen"
                                                        ? "text-emerald-400"
                                                        : "text-muted/40"
                                                    }`}
                                            >
                                                {hand.status === "busted" ? "BUSTED" : hand.status === "stayed" ? "LOCKED" : hand.status === "frozen" ? "FROZEN" : "ACTIVE"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Round Score */}
                                {hand && hand.status !== "active" && (
                                    <div className="text-right shrink-0 px-2 line-clamp-1">
                                        <span
                                            className={`text-xs font-black font-mono ${hand.status === "busted"
                                                ? "text-red-500/40"
                                                : "text-emerald-400"
                                                }`}
                                        >
                                            {hand.status === "busted" ? "0" : `+${roundScore}`}
                                        </span>
                                    </div>
                                )}

                                {/* Total Score */}
                                <div className="text-right shrink-0 min-w-[3ch]">
                                    <motion.span
                                        key={cumScore}
                                        initial={{ scale: 1.2, color: "#d4a843" }}
                                        animate={{ scale: 1, color: isCurrentUser ? "#d4a843" : "#f0ead6" }}
                                        className="font-black font-mono text-sm block"
                                    >
                                        {cumScore}
                                    </motion.span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    className={`h-full rounded-full ${isCurrentUser ? "bg-gradient-to-r from-gold to-amber-300" : "bg-white/20"}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
