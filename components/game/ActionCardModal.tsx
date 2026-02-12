"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Shield, Snowflake } from "lucide-react";
import type { RoomPlayer } from "@/lib/firestore-schema";

interface ActionCardModalProps {
    type: "flip-three" | "freeze" | "second-chance-pass";
    players: RoomPlayer[];
    currentUserId: string;
    onSelectPlayer: (playerId: string) => void;
    onCancel: () => void;
    onSelf?: () => void;
}

export default function ActionCardModal({
    type,
    players,
    currentUserId,
    onSelectPlayer,
    onCancel,
    onSelf,
}: ActionCardModalProps) {
    const isFlipThree = type === "flip-three";
    const isFreeze = type === "freeze";
    const title = isFlipThree
        ? "Flip Three"
        : isFreeze
            ? "Freeze"
            : "Pass Second Chance";
    const description = isFlipThree
        ? "Choose a player to draw 3 cards (or yourself)"
        : isFreeze
            ? "Choose a player to freeze (banks their current score)"
            : "Give your Second Chance to a player (or yourself)";
    const Icon = isFlipThree ? Target : isFreeze ? Snowflake : Shield;

    // All action cards: player can target self or others
    const selectablePlayers = players;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-surface rounded-2xl border border-muted/20 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-muted/10">
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFlipThree
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-emerald/20 text-emerald"
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-foreground font-semibold">{title}</h3>
                                <p className="text-xs text-muted">{description}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-muted" />
                        </button>
                    </div>

                    {/* Player List */}
                    <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
                        {selectablePlayers.map((player) => {
                            const isSelf = player.uid === currentUserId;

                            return (
                                <motion.button
                                    key={player.uid}
                                    type="button"
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (isSelf && onSelf) {
                                            onSelf();
                                        } else {
                                            onSelectPlayer(player.uid);
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${isSelf
                                        ? "bg-gold/10 border border-gold/20 hover:bg-gold/20"
                                        : "bg-background/50 hover:bg-background border border-muted/10"
                                        }`}
                                >
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

                                    <span className="text-sm font-medium text-foreground flex-1 text-left">
                                        {isSelf ? "Yourself" : player.displayName}
                                    </span>

                                    {isSelf && (
                                        <span className="text-xs text-gold">Self</span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
