"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Trophy,
    Medal,
    TrendingUp,
    Target,
    Star,
    Loader2,
    Gamepad2,
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { getLeaderboard } from "@/lib/history-service";
import type { UserProfile } from "@/lib/firestore-schema";

function LeaderboardContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const data = await getLeaderboard();
                setProfiles(data);
            } catch (err) {
                console.error("Error fetching leaderboard:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-gold" />;
        if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
        if (index === 2) return <Medal className="w-5 h-5 text-amber-700" />;
        return (
            <span className="text-sm font-mono text-muted w-6 text-center">
                {index + 1}
            </span>
        );
    };

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
                    <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6">
                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-gold animate-spin" />
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && profiles.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <Gamepad2 className="w-16 h-16 text-muted/30 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            No players yet
                        </h2>
                        <p className="text-muted text-sm mb-6">
                            Complete games to see the leaderboard.
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

                {/* Top 3 Podium */}
                {!isLoading && profiles.length >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end justify-center gap-3 mb-8 pt-4"
                    >
                        {/* 2nd Place */}
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-2 border-2 border-gray-400/30">
                                {profiles[1].photoURL ? (
                                    <img
                                        src={profiles[1].photoURL}
                                        alt=""
                                        className="w-14 h-14 rounded-full"
                                    />
                                ) : (
                                    <span className="text-lg font-bold text-foreground">
                                        {profiles[1].displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-foreground font-medium truncate max-w-[80px]">
                                {profiles[1].displayName}
                            </span>
                            <div className="mt-2 w-20 bg-gray-500/20 rounded-t-lg flex flex-col items-center py-4">
                                <Medal className="w-5 h-5 text-gray-400 mb-1" />
                                <span className="text-sm font-bold font-mono text-foreground">
                                    {profiles[1].gamesWon}
                                </span>
                                <span className="text-[10px] text-muted">wins</span>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="flex flex-col items-center -mt-4">
                            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-2 border-2 border-gold/40 ring-2 ring-gold/20 ring-offset-2 ring-offset-background">
                                {profiles[0].photoURL ? (
                                    <img
                                        src={profiles[0].photoURL}
                                        alt=""
                                        className="w-16 h-16 rounded-full"
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-gold">
                                        {profiles[0].displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm text-gold font-semibold truncate max-w-[90px]">
                                {profiles[0].displayName}
                            </span>
                            <div className="mt-2 w-24 bg-gold/10 rounded-t-lg flex flex-col items-center py-6 border border-gold/20">
                                <Trophy className="w-6 h-6 text-gold mb-1" />
                                <span className="text-lg font-bold font-mono text-gold">
                                    {profiles[0].gamesWon}
                                </span>
                                <span className="text-[10px] text-muted">wins</span>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mb-2 border-2 border-amber-700/30">
                                {profiles[2].photoURL ? (
                                    <img
                                        src={profiles[2].photoURL}
                                        alt=""
                                        className="w-14 h-14 rounded-full"
                                    />
                                ) : (
                                    <span className="text-lg font-bold text-foreground">
                                        {profiles[2].displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-foreground font-medium truncate max-w-[80px]">
                                {profiles[2].displayName}
                            </span>
                            <div className="mt-2 w-20 bg-amber-800/20 rounded-t-lg flex flex-col items-center py-3">
                                <Medal className="w-5 h-5 text-amber-700 mb-1" />
                                <span className="text-sm font-bold font-mono text-foreground">
                                    {profiles[2].gamesWon}
                                </span>
                                <span className="text-[10px] text-muted">wins</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Full Rankings Table */}
                {!isLoading && profiles.length > 0 && (
                    <div className="space-y-1.5">
                        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 text-xs text-muted px-4 py-2 uppercase tracking-wider font-semibold">
                            <span>#</span>
                            <span>Player</span>
                            <span className="text-center">Wins</span>
                            <span className="text-center">Win %</span>
                            <span className="text-right">Total</span>
                        </div>

                        {profiles.map((profile, index) => {
                            const isCurrentUser = profile.uid === user?.uid;
                            const winRate =
                                profile.gamesPlayed > 0
                                    ? Math.round(
                                        (profile.gamesWon / profile.gamesPlayed) * 100
                                    )
                                    : 0;

                            return (
                                <motion.div
                                    key={profile.uid}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={`grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 items-center px-4 py-3 rounded-xl border transition-colors ${isCurrentUser
                                            ? "bg-gold/5 border-gold/20"
                                            : "bg-surface border-muted/10"
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className="w-7 flex items-center justify-center">
                                        {getRankIcon(index)}
                                    </div>

                                    {/* Player */}
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
                                            {profile.photoURL ? (
                                                <img
                                                    src={profile.photoURL}
                                                    alt=""
                                                    className="w-7 h-7 rounded-full"
                                                />
                                            ) : (
                                                <span className="text-xs font-semibold text-foreground">
                                                    {profile.displayName.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <span
                                            className={`text-sm font-medium truncate ${isCurrentUser ? "text-gold" : "text-foreground"
                                                }`}
                                        >
                                            {profile.displayName}
                                        </span>
                                    </div>

                                    {/* Wins */}
                                    <span className="text-sm font-bold font-mono text-emerald text-center w-10">
                                        {profile.gamesWon}
                                    </span>

                                    {/* Win Rate */}
                                    <span className="text-sm font-mono text-foreground text-center w-12">
                                        {winRate}%
                                    </span>

                                    {/* Total Score */}
                                    <span className="text-sm font-mono text-muted text-right w-14">
                                        {profile.totalScore.toLocaleString()}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* My Stats Card */}
                {!isLoading && user && (
                    <div className="mt-8">
                        {(() => {
                            const myProfile = profiles.find((p) => p.uid === user.uid);
                            if (!myProfile) return null;

                            const winRate =
                                myProfile.gamesPlayed > 0
                                    ? Math.round(
                                        (myProfile.gamesWon / myProfile.gamesPlayed) * 100
                                    )
                                    : 0;

                            const rank = profiles.findIndex((p) => p.uid === user.uid) + 1;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gold/5 border border-gold/20 rounded-xl p-5"
                                >
                                    <h3 className="text-xs font-semibold text-gold uppercase tracking-wider mb-4">
                                        Your Stats
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gold/10 flex items-center justify-center">
                                                <Star className="w-4 h-4 text-gold" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-foreground font-mono">
                                                    #{rank}
                                                </p>
                                                <p className="text-[10px] text-muted uppercase">Rank</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-emerald/10 flex items-center justify-center">
                                                <Trophy className="w-4 h-4 text-emerald" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-foreground font-mono">
                                                    {myProfile.gamesWon}/{myProfile.gamesPlayed}
                                                </p>
                                                <p className="text-[10px] text-muted uppercase">
                                                    Wins ({winRate}%)
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-foreground font-mono">
                                                    {myProfile.totalScore.toLocaleString()}
                                                </p>
                                                <p className="text-[10px] text-muted uppercase">
                                                    Total Pts
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <Target className="w-4 h-4 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-foreground font-mono">
                                                    {myProfile.highestRoundScore}
                                                </p>
                                                <p className="text-[10px] text-muted uppercase">
                                                    Best Round
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <AuthGuard>
            <LeaderboardContent />
        </AuthGuard>
    );
}
