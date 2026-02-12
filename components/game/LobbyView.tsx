"use client";

import { Crown, Loader2 } from "lucide-react";
import RoomHeader from "@/components/game/RoomHeader";
import PlayerAvatar from "@/components/ui/PlayerAvatar";
import type { Room } from "@/lib/firestore-schema";

interface LobbyViewProps {
    code: string;
    room: Room;
    user: any; // Using any for auth user context object or specific type
    isHost: boolean;
    canStartGame: boolean;
    isStarting: boolean;
    isLeaving: boolean;
    onLeave: () => void;
    onStartGame: () => void;
    onUpdateTargetScore: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function LobbyView({
    code,
    room,
    user,
    isHost,
    canStartGame,
    isStarting,
    isLeaving,
    onLeave,
    onStartGame,
    onUpdateTargetScore,
}: LobbyViewProps) {
    return (
        <div className="min-h-screen bg-background">
            <RoomHeader
                code={code}
                playerCount={room.players.length}
                onLeave={onLeave}
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
                                    Target Score
                                </span>
                                <span className="text-sm font-medium text-muted">
                                    First to reach this score wins
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min="100"
                                    step="50"
                                    value={room.targetScore ?? 200}
                                    onChange={onUpdateTargetScore}
                                    disabled={!isHost}
                                    className="w-24 bg-surface border border-white/10 rounded-lg px-3 py-2 text-right font-mono text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <span className="text-sm font-bold text-muted/40">PTS</span>
                            </div>
                        </div>

                        {/* Player List */}
                        <div className="space-y-3 mb-12">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black text-muted/40 uppercase tracking-widest">
                                    Players ({room.players.length}/8)
                                </span>
                                {room.players.length < 2 && (
                                    <span className="text-[10px] font-bold text-amber-500/80 animate-pulse">
                                        Waiting for players...
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {room.players.map((player) => (
                                    <div
                                        key={player.uid}
                                        className="group bg-surface hover:bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <PlayerAvatar
                                                    photoURL={player.photoURL}
                                                    displayName={player.displayName}
                                                    size="md"
                                                    className="border-2 border-white/5 shadow-lg"
                                                />
                                                {player.uid === room.hostId && (
                                                    <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-300 to-amber-600 p-1 rounded-full shadow-lg border border-black/20">
                                                        <Crown className="w-2.5 h-2.5 text-black" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground group-hover:text-gold transition-colors">
                                                    {player.displayName}
                                                </span>
                                                {player.uid === user?.uid && (
                                                    <span className="text-[10px] font-medium text-emerald">
                                                        (You)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty slots placeholders */}
                                {Array.from({ length: Math.max(0, 4 - room.players.length) }).map(
                                    (_, i) => (
                                        <div
                                            key={`empty-${i}`}
                                            className="border border-dashed border-white/5 rounded-xl p-3 flex items-center justify-center opacity-30"
                                        >
                                            <span className="text-xs font-medium text-muted">
                                                Waiting...
                                            </span>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            {isHost ? (
                                <button
                                    type="button"
                                    onClick={onStartGame}
                                    disabled={!canStartGame || isStarting}
                                    className="w-full py-4 bg-gold text-background font-black text-lg rounded-xl shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-wide flex items-center justify-center gap-3"
                                >
                                    {isStarting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <Crown className="w-5 h-5" />
                                            Start Game
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full py-4 bg-surface border border-white/5 text-muted font-bold text-sm rounded-xl text-center flex items-center justify-center gap-3 uppercase tracking-wide">
                                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                                    Waiting for host to start...
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={onLeave}
                                disabled={isLeaving}
                                className="w-full py-3 bg-red-500/10 text-red-500 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-all uppercase tracking-wide disabled:opacity-50"
                            >
                                {isLeaving ? "Leaving..." : "Leave Room"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
