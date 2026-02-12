"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Trophy,
    Calendar,
    Users,
    Clock,
    ChevronRight,
    ArrowLeft,
    Loader2,
    Gamepad2,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { getUserGames } from "@/lib/history-service";
import type { GameRecord } from "@/lib/firestore-schema";

function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

function HistoryContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [games, setGames] = useState<GameRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchGames = async () => {
            try {
                const data = await getUserGames(user.uid);
                setGames(data);
            } catch (err) {
                console.error("Error fetching games:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGames();
    }, [user]);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-muted/10">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        className="p-2 hover:bg-surface rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">Past Games</h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6">
                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-gold animate-spin" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && games.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <Gamepad2 className="w-16 h-16 text-muted/30 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            No games yet
                        </h2>
                        <p className="text-muted text-sm mb-6">
                            Complete your first game and it will show up here.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push("/")}
                            className="px-6 py-3 bg-gold text-background font-semibold rounded-lg hover:bg-gold/90 transition-colors"
                        >
                            Play Now
                        </button>
                    </motion.div>
                )}

                {/* Game List */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {games.map((game, index) => {
                            const winner = game.players.find(
                                (p) => p.uid === game.winnerId
                            );
                            const didWin = game.winnerId === user?.uid;
                            const myScore = game.finalScores[user?.uid || ""] || 0;

                            return (
                                <motion.button
                                    key={game.id}
                                    type="button"
                                    onClick={() => router.push(`/history/${game.id}`)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full text-left p-4 rounded-xl border transition-colors ${didWin
                                            ? "bg-gold/5 border-gold/20 hover:bg-gold/10"
                                            : "bg-surface border-muted/10 hover:bg-surface/80"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Win indicator */}
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${didWin
                                                    ? "bg-gold/20 text-gold"
                                                    : "bg-muted/10 text-muted"
                                                }`}
                                        >
                                            {didWin ? (
                                                <Trophy className="w-5 h-5" />
                                            ) : (
                                                <span className="text-sm font-mono font-bold">
                                                    {myScore}
                                                </span>
                                            )}
                                        </div>

                                        {/* Game info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={`text-sm font-semibold ${didWin ? "text-gold" : "text-foreground"
                                                        }`}
                                                >
                                                    {didWin ? "Victory! 🎉" : `${winner?.displayName} won`}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-muted">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(game.createdAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {game.players.length}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDuration(game.duration)}
                                                </span>
                                            </div>

                                            {/* Player scores mini */}
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {game.players
                                                    .sort(
                                                        (a, b) =>
                                                            (game.finalScores[b.uid] || 0) -
                                                            (game.finalScores[a.uid] || 0)
                                                    )
                                                    .slice(0, 4)
                                                    .map((player) => (
                                                        <span
                                                            key={player.uid}
                                                            className={`text-xs px-2 py-0.5 rounded-full ${player.uid === game.winnerId
                                                                    ? "bg-gold/15 text-gold"
                                                                    : "bg-muted/10 text-muted"
                                                                }`}
                                                        >
                                                            {player.displayName.split(" ")[0]}:{" "}
                                                            {game.finalScores[player.uid] || 0}
                                                        </span>
                                                    ))}
                                            </div>
                                        </div>

                                        <ChevronRight className="w-5 h-5 text-muted shrink-0" />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default function HistoryPage() {
    return (
        <AuthGuard>
            <HistoryContent />
        </AuthGuard>
    );
}
