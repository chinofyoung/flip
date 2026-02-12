"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Star, Home, RotateCcw } from "lucide-react";
import type { Room } from "@/lib/firestore-schema";

interface GameOverScreenProps {
    room: Room;
    cumulativeScores: Record<string, number>;
    currentUserId: string;
    onPlayAgain: () => void;
    onExit: () => void;
}

interface Particle {
    id: number;
    initialX: number;
    rotateStart: number;
    rotateEnd: number;
    duration: number;
    delay: number;
    repeatDelay: number;
    color: string;
}

export default function GameOverScreen({
    room,
    cumulativeScores,
    currentUserId,
    onPlayAgain,
    onExit,
}: GameOverScreenProps) {
    // A simple seeded random function to maintain purity
    const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    // Confetti particles state - useMemo is fine if we use a deterministic seed
    const particles = useMemo(() => {
        // Use room.id as a seed to make it "random" but deterministic for this specific game
        const seedValue = room.players.length + Object.keys(cumulativeScores).length;

        return Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            initialX: seededRandom(seedValue + i) * 800,
            rotateStart: 0,
            rotateEnd: seededRandom(seedValue + i + 100) * 360,
            duration: 3 + seededRandom(seedValue + i + 200) * 3,
            delay: seededRandom(seedValue + i + 300) * 2,
            repeatDelay: seededRandom(seedValue + i + 400) * 5,
            color: ["bg-gold", "bg-emerald", "bg-blue-400", "bg-red-400", "bg-amber-400"][i % 5],
        }));
    }, [room.players.length, cumulativeScores]);

    // Sort by final score descending
    const standings = [...room.players]
        .map((player) => ({
            player,
            score: cumulativeScores[player.uid] || 0,
        }))
        .sort((a, b) => b.score - a.score);

    const winner = standings[0];
    const isWinner = winner?.player.uid === currentUserId;

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
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            {/* Confetti-like particles */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                {particles.map((p: Particle) => (
                    <motion.div
                        key={p.id}
                        initial={{
                            x: p.initialX,
                            y: -20,
                            rotate: p.rotateStart,
                            opacity: 1,
                        }}
                        animate={{
                            y: typeof window !== "undefined" ? window.innerHeight + 20 : 800,
                            rotate: p.rotateEnd,
                            opacity: 0,
                        }}
                        transition={{
                            duration: p.duration,
                            delay: p.delay,
                            repeat: Infinity,
                            repeatDelay: p.repeatDelay,
                        }}
                        className={`absolute w-3 h-3 rounded-sm ${p.color}`}
                    />
                ))}
            </div>

            {/* Winner Announcement */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="text-center mb-8 relative z-10"
            >
                <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
                </motion.div>

                <h1 className="text-3xl font-bold text-foreground mb-2">
                    {isWinner ? "You Win! 🎉" : "Game Over!"}
                </h1>

                <p className="text-lg text-muted">
                    <span className="text-gold font-semibold">
                        {winner?.player.displayName}
                    </span>{" "}
                    wins with{" "}
                    <span className="text-emerald font-bold">{winner?.score}</span> points
                </p>
            </motion.div>

            {/* Final Standings */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-sm space-y-2 mb-8 relative z-10"
            >
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    Final Standings
                </h3>

                {standings.map(({ player, score }, index) => {
                    const isCurrentUser = player.uid === currentUserId;

                    return (
                        <motion.div
                            key={player.uid}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className={`flex items-center gap-3 p-4 rounded-xl border ${index === 0
                                ? "bg-gold/10 border-gold/30"
                                : isCurrentUser
                                    ? "bg-emerald/5 border-emerald/20"
                                    : "bg-surface border-muted/10"
                                }`}
                        >
                            {/* Rank */}
                            <div className="w-8 flex items-center justify-center shrink-0">
                                {getRankIcon(index)}
                            </div>

                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-muted/20 flex items-center justify-center shrink-0">
                                {player.photoURL ? (
                                    <img
                                        src={player.photoURL}
                                        alt=""
                                        className="w-9 h-9 rounded-full"
                                    />
                                ) : (
                                    <span className="text-sm font-semibold text-foreground">
                                        {player.displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            {/* Name */}
                            <div className="flex-1 min-w-0">
                                <span
                                    className={`text-sm font-medium truncate block ${index === 0 ? "text-gold" : "text-foreground"
                                        }`}
                                >
                                    {player.displayName}
                                    {isCurrentUser && " (You)"}
                                </span>
                            </div>

                            {/* Score */}
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8 + index * 0.1 }}
                                className={`text-xl font-bold font-mono ${index === 0 ? "text-gold" : "text-foreground"
                                    }`}
                            >
                                {score}
                            </motion.span>

                            {index === 0 && (
                                <Star className="w-4 h-4 text-gold fill-gold shrink-0" />
                            )}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="w-full max-w-sm space-y-3 relative z-10"
            >
                <button
                    type="button"
                    onClick={onPlayAgain}
                    className="w-full py-4 bg-gold text-background font-bold rounded-xl hover:bg-gold/90 transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                </button>

                <button
                    type="button"
                    onClick={onExit}
                    className="w-full py-3 text-muted hover:text-foreground border border-muted/20 hover:border-muted/40 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <Home className="w-4 h-4" />
                    Back to Home
                </button>
            </motion.div>
        </div>
    );
}
