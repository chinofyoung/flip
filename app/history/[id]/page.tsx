"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Trophy,
    Medal,
    Flame,
    Loader2,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { getGameById } from "@/lib/history-service";
import type { GameRecord, Card } from "@/lib/firestore-schema";

function getCardColor(card: Card): string {
    switch (card.type) {
        case "number":
            return "from-blue-500/30 to-blue-700/30 border-blue-500/40 text-blue-300";
        case "modifier":
            return "from-amber-500/30 to-amber-700/30 border-amber-500/40 text-amber-300";
        case "action":
            return "from-red-500/30 to-red-700/30 border-red-500/40 text-red-300";
    }
}

function getCardLabel(card: Card): string {
    if (card.type === "number") return card.value.toString();
    if (card.type === "modifier") {
        if (card.value === "x2") return "×2";
        return card.value as string;
    }
    if (card.value === "freeze") return "❄️";
    if (card.value === "flip-three") return "3×";
    if (card.value === "second-chance") return "🛡️";
    return card.label;
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

function GameDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const gameId = params.id as string;

    const [game, setGame] = useState<GameRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const data = await getGameById(gameId);
                setGame(data);
                // Auto-expand the last round
                if (data && data.rounds.length > 0) {
                    setExpandedRounds(new Set([data.rounds.length]));
                }
            } catch (err) {
                console.error("Error fetching game:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGame();
    }, [gameId]);

    const toggleRound = (roundNumber: number) => {
        setExpandedRounds((prev) => {
            const next = new Set(prev);
            if (next.has(roundNumber)) {
                next.delete(roundNumber);
            } else {
                next.add(roundNumber);
            }
            return next;
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Game not found
                    </h2>
                    <button
                        type="button"
                        onClick={() => router.push("/history")}
                        className="text-gold hover:underline"
                    >
                        Back to History
                    </button>
                </div>
            </div>
        );
    }

    const winner = game.players.find((p) => p.uid === game.winnerId);
    const sortedPlayers = [...game.players].sort(
        (a, b) => (game.finalScores[b.uid] || 0) - (game.finalScores[a.uid] || 0)
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-muted/10">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/history")}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Game Detail</h1>
                        <p className="text-xs text-muted">{formatDate(game.createdAt)}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                {/* Winner Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gold/10 border border-gold/20 rounded-xl p-6 text-center"
                >
                    <Trophy className="w-10 h-10 text-gold mx-auto mb-3" />
                    <h2 className="text-xl font-bold text-foreground mb-1">
                        {winner?.displayName} wins!
                    </h2>
                    <p className="text-gold font-mono text-2xl font-bold">
                        {game.finalScores[game.winnerId]} pts
                    </p>
                    <p className="text-xs text-muted mt-2">
                        {game.rounds.length} rounds · {formatDuration(game.duration)}
                    </p>
                </motion.div>

                {/* Final Standings */}
                <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                        Final Standings
                    </h3>
                    <div className="space-y-1.5">
                        {sortedPlayers.map((player, index) => {
                            const isCurrentUser = player.uid === user?.uid;
                            const score = game.finalScores[player.uid] || 0;

                            return (
                                <motion.div
                                    key={player.uid}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${index === 0
                                            ? "bg-gold/5 border-gold/20"
                                            : isCurrentUser
                                                ? "bg-emerald/5 border-emerald/20"
                                                : "bg-surface border-muted/10"
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className="w-7 flex items-center justify-center shrink-0">
                                        {index === 0 ? (
                                            <Trophy className="w-5 h-5 text-gold" />
                                        ) : index === 1 ? (
                                            <Medal className="w-4 h-4 text-gray-400" />
                                        ) : index === 2 ? (
                                            <Medal className="w-4 h-4 text-amber-700" />
                                        ) : (
                                            <span className="text-sm font-mono text-muted">
                                                {index + 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
                                        {player.photoURL ? (
                                            <img
                                                src={player.photoURL}
                                                alt=""
                                                className="w-8 h-8 rounded-full"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold text-foreground">
                                                {player.displayName.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                                        {player.displayName}
                                        {isCurrentUser && " (You)"}
                                    </span>

                                    {/* Score */}
                                    <span
                                        className={`font-bold font-mono ${index === 0 ? "text-gold text-lg" : "text-foreground"
                                            }`}
                                    >
                                        {score}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Round-by-Round Breakdown */}
                <div>
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                        Round Breakdown
                    </h3>

                    <div className="space-y-2">
                        {game.rounds.map((round) => {
                            const isExpanded = expandedRounds.has(round.roundNumber);
                            const roundPlayers = [...game.players].sort(
                                (a, b) =>
                                    (round.scores[b.uid] || 0) - (round.scores[a.uid] || 0)
                            );

                            return (
                                <div
                                    key={round.roundNumber}
                                    className="bg-surface border border-muted/10 rounded-xl overflow-hidden"
                                >
                                    {/* Round header (clickable) */}
                                    <button
                                        type="button"
                                        onClick={() => toggleRound(round.roundNumber)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-background/30 transition-colors"
                                    >
                                        <span className="text-sm font-semibold text-foreground">
                                            Round {round.roundNumber}
                                        </span>

                                        <div className="flex items-center gap-3">
                                            {/* Top scorer chip */}
                                            {roundPlayers[0] && round.scores[roundPlayers[0].uid] > 0 && (
                                                <span className="text-xs text-gold">
                                                    {roundPlayers[0].displayName.split(" ")[0]}: +
                                                    {round.scores[roundPlayers[0].uid]}
                                                </span>
                                            )}
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-muted" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-muted" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded content */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-3 border-t border-muted/10 pt-3">
                                            {roundPlayers.map((player) => {
                                                const roundScore = round.scores[player.uid] || 0;
                                                const cards = round.hands[player.uid] || [];
                                                const isBusted = roundScore === 0 && cards.length > 0;

                                                return (
                                                    <div key={player.uid} className="space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-foreground font-medium">
                                                                    {player.displayName}
                                                                </span>
                                                                {isBusted && (
                                                                    <Flame className="w-3.5 h-3.5 text-red-400" />
                                                                )}
                                                            </div>
                                                            <span
                                                                className={`text-sm font-bold font-mono ${isBusted
                                                                        ? "text-red-400"
                                                                        : roundScore > 0
                                                                            ? "text-emerald"
                                                                            : "text-muted"
                                                                    }`}
                                                            >
                                                                {isBusted ? "BUST" : `+${roundScore}`}
                                                            </span>
                                                        </div>

                                                        {/* Cards drawn */}
                                                        <div className="flex flex-wrap gap-1">
                                                            {cards.map((card) => (
                                                                <div
                                                                    key={card.id}
                                                                    className={`w-8 h-11 rounded-md bg-gradient-to-br border flex items-center justify-center font-bold text-[10px] ${getCardColor(
                                                                        card
                                                                    )}`}
                                                                >
                                                                    {getCardLabel(card)}
                                                                </div>
                                                            ))}
                                                            {cards.length === 0 && (
                                                                <span className="text-xs text-muted italic">
                                                                    No cards
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function GameDetailPage() {
    return (
        <AuthGuard>
            <GameDetailContent />
        </AuthGuard>
    );
}
