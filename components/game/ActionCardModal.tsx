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
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 100, opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-black/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="relative p-8 pb-4 text-center">
                        <div
                            className={`w-16 h-16 rounded-[2rem] mx-auto flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${isFlipThree
                                ? "bg-red-500/20 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                : "bg-emerald/20 text-emerald shadow-[0_0_20px_rgba(45,212,160,0.2)]"
                                }`}
                        >
                            <Icon className="w-8 h-8" />
                        </div>

                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">
                            {title}
                        </h3>
                        <p className="text-[10px] font-bold text-muted/60 uppercase tracking-[0.2em] mt-2 leading-relaxed">
                            {description}
                        </p>

                        <button
                            type="button"
                            onClick={onCancel}
                            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-muted/40" />
                        </button>
                    </div>

                    {/* Player List */}
                    <div className="p-6 pt-2 space-y-2 max-h-[24rem] overflow-y-auto custom-scrollbar">
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
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${isSelf
                                        ? "bg-gold/10 border-gold/30"
                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                                        {player.photoURL ? (
                                            <img
                                                src={player.photoURL}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-black text-foreground/40">
                                                {player.displayName.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 text-left">
                                        <span className={`text-sm font-black uppercase tracking-tight block ${isSelf ? "text-gold" : "text-foreground"}`}>
                                            {isSelf ? "Yourself" : player.displayName}
                                        </span>
                                        {isSelf && (
                                            <span className="text-[10px] font-bold text-gold/40 uppercase tracking-widest leading-none">Primary Target</span>
                                        )}
                                    </div>

                                    {!isSelf && (
                                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="p-6 bg-white/5 text-center mt-2">
                        <p className="text-[9px] font-black text-muted/20 uppercase tracking-[0.4em]">
                            Choose Wisely
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
