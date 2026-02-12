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
            const cumScore = cumulativeScores[player.uid] || 0;
            return { player, hand, roundScore, cumScore };
        })
        .sort((a, b) => b.roundScore - a.roundScore);

    const topScorer = sortedPlayers[0];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Round Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">
                    Round {roundNumber} Complete
                </h2>
                {topScorer && topScorer.roundScore > 0 && (
                    <p className="text-muted mt-1">
                        <span className="text-gold font-semibold">
                            {topScorer.player.displayName}
                        </span>{" "}
                        leads with{" "}
                        <span className="text-emerald font-semibold">
                            +{topScorer.roundScore}
                        </span>
                    </p>
                )}
            </div>

            {/* Player Results */}
            <div className="space-y-2">
                {sortedPlayers.map(({ player, hand, roundScore, cumScore }, index) => (
                    <motion.div
                        key={player.uid}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border ${hand?.status === "busted"
                                ? "bg-red-500/5 border-red-500/20"
                                : index === 0 && roundScore > 0
                                    ? "bg-gold/5 border-gold/20"
                                    : "bg-surface border-muted/10"
                            }`}
                    >
                        {/* Rank */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                            {index === 0 && roundScore > 0 ? (
                                <Trophy className="w-5 h-5 text-gold" />
                            ) : hand?.status === "busted" ? (
                                <Flame className="w-5 h-5 text-red-400" />
                            ) : (
                                <span className="text-sm font-mono text-muted">
                                    {index + 1}
                                </span>
                            )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate block">
                                {player.displayName}
                            </span>

                            {/* Cards drawn count */}
                            <span className="text-xs text-muted">
                                {hand?.cards.length || 0} cards drawn
                                {hand?.status === "busted" && " · Busted!"}
                                {hand?.status === "frozen" && " · Frozen"}
                                {hand?.status === "stayed" && " · Stayed"}
                            </span>
                        </div>

                        {/* Round Score */}
                        <div className="text-right shrink-0">
                            <div
                                className={`text-lg font-bold font-mono ${hand?.status === "busted"
                                        ? "text-red-400"
                                        : roundScore > 0
                                            ? "text-emerald"
                                            : "text-muted"
                                    }`}
                            >
                                {hand?.status === "busted" ? "0" : `+${roundScore}`}
                            </div>

                            {/* Cumulative */}
                            <div className="flex items-center gap-1 justify-end">
                                <TrendingUp className="w-3 h-3 text-muted" />
                                <span className="text-xs text-muted font-mono">{cumScore}</span>
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gold text-background font-bold text-lg rounded-xl hover:bg-gold/90 transition-colors"
                >
                    Next Round →
                </motion.button>
            )}

            {!isHost && (
                <p className="text-center text-muted text-sm">
                    Waiting for host to start next round...
                </p>
            )}
        </motion.div>
    );
}
