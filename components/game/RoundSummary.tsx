"use client";

import { motion } from "framer-motion";
import { Trophy, TrendingUp, Flame } from "lucide-react";
import type { Room, Round } from "@/lib/firestore-schema";

interface RoundSummaryProps {
    room: Room;
    round: Round;
    cumulativeScores: Record<string, number>;
    roundNumber: number;
    onNextRound: () => void;
    isHost: boolean;
}

export default function RoundSummary({
    room,
    round,
    cumulativeScores,
    roundNumber,
    onNextRound,
    isHost,
}: RoundSummaryProps) {
    // Sort players by round score (descending)
    const sortedPlayers = [...room.players]
        .map((player) => {
            const hand = round.playerHands[player.uid];
            const roundScore = hand && hand.status !== "busted" ? hand.score : 0;
            // cumulativeScores prop represents scores BEFORE this round
            const prevCumScore = cumulativeScores[player.uid] || 0;
            const newCumScore = prevCumScore + roundScore;
            return { player, hand, roundScore, newCumScore };
        })
        .sort((a, b) => b.roundScore - a.roundScore);

    const topScorer = sortedPlayers[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Round Header */}
            <div className="text-center relative py-6">
                <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full opacity-50 pointer-events-none" />
                <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase italic">
                    Round {roundNumber} <span className="text-gold">Over</span>
                </h2>
                {topScorer && topScorer.roundScore > 0 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-muted/60 mt-2 text-xs font-bold uppercase tracking-[0.2em]"
                    >
                        MVP: <span className="text-white">{topScorer.player.displayName}</span> (+{topScorer.roundScore})
                    </motion.p>
                )}
            </div>

            {/* Player Results */}
            <div className="space-y-3">
                {sortedPlayers.map(({ player, hand, roundScore, newCumScore }, index) => (
                    <motion.div
                        key={player.uid}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1, type: "spring", stiffness: 300 }}
                        className={`flex items-center gap-4 p-5 rounded-2xl border backdrop-blur-md shadow-xl transition-all ${hand?.status === "busted"
                            ? "bg-red-500/5 border-red-500/20 shadow-red-900/5 grayscale brightness-75"
                            : index === 0 && roundScore > 0
                                ? "bg-gold/10 border-gold/30 shadow-gold/10 ring-1 ring-gold/20"
                                : "bg-black/40 border-white/5"
                            }`}
                    >
                        {/* Rank */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/5">
                            {index === 0 && roundScore > 0 ? (
                                <Trophy className="w-5 h-5 text-gold drop-shadow-[0_0_8px_rgba(212,168,67,0.5)]" />
                            ) : hand?.status === "busted" ? (
                                <Flame className="w-5 h-5 text-red-400" />
                            ) : (
                                <span className="text-lg font-black font-mono text-muted/40">
                                    {index + 1}
                                </span>
                            )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-black text-foreground uppercase tracking-tight block">
                                {player.displayName}
                            </span>

                            {/* Cards drawn count */}
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">
                                    {hand?.cards.length || 0} Cards
                                </span>
                                {hand?.status !== "active" && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded leading-none ${hand?.status === "busted" ? "bg-red-500/20 text-red-400" :
                                        hand?.status === "frozen" ? "bg-blue-500/20 text-blue-400" :
                                            "bg-emerald-500/20 text-emerald-400"
                                        }`}>
                                        {hand?.status === "busted" ? "BUSTED" : hand?.status === "frozen" ? "FROZEN" : "LOCKED"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Round Score */}
                        <div className="text-right shrink-0">
                            <div
                                className={`text-2xl font-black font-mono tracking-tighter ${hand?.status === "busted"
                                    ? "text-red-900/50"
                                    : roundScore > 0
                                        ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                                        : "text-muted/20"
                                    }`}
                            >
                                {hand?.status === "busted" ? "0" : `+${roundScore}`}
                            </div>

                            {/* Cumulative */}
                            <div className="flex items-center gap-1 justify-end opacity-40">
                                <TrendingUp className="w-2.5 h-2.5" />
                                <span className="text-[10px] font-black font-mono tracking-widest">{newCumScore}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Next Round Button (host only) */}
            {isHost && (
                <motion.button
                    type="button"
                    onClick={onNextRound}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative w-full py-5 bg-gold text-background font-black text-xl rounded-2xl shadow-2xl shadow-gold/20 overflow-hidden uppercase tracking-tighter italic"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {sortedPlayers.some(p => p.newCumScore >= room.targetScore)
                            ? "Finish Game"
                            : "Next Round"}
                        <TrendingUp className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </motion.button>
            )}

            {!isHost && (
                <div className="text-center space-y-3">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex justify-center"
                    >
                        <div className="w-1 h-1 bg-gold rounded-full mx-0.5" />
                        <div className="w-1 h-1 bg-gold rounded-full mx-0.5" />
                        <div className="w-1 h-1 bg-gold rounded-full mx-0.5" />
                    </motion.div>
                    <p className="text-muted/40 text-[10px] font-black uppercase tracking-[0.3em]">
                        Waiting for host
                    </p>
                </div>
            )}
        </motion.div>
    );
}
