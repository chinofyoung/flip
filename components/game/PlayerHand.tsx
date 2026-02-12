"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, X } from "lucide-react";
import type { Card } from "@/lib/firestore-schema";
import { calculateScore, hasFlipSeven, isBusted } from "@/lib/game/scoring";

interface PlayerHandProps {
    cards: Card[];
    hasSecondChance: boolean;
    status: "active" | "stayed" | "busted" | "frozen";
    onRemoveCard?: (cardId: string) => void;
    isOwnHand?: boolean;
}

function getCardStyle(card: Card, busted: boolean) {
    const base = "relative w-12 h-16 rounded-xl bg-gradient-to-br border flex items-center justify-center font-bold text-sm shadow-lg ring-1 ring-inset ring-white/5 transition-all";

    switch (card.type) {
        case "number":
            return `${base} from-blue-500/10 to-blue-900/40 border-blue-500/30 text-blue-100 ${busted ? "grayscale brightness-50 border-red-900/50" : "shadow-blue-900/20"}`;
        case "modifier":
            return `${base} from-amber-500/10 to-amber-900/40 border-amber-500/30 text-amber-100 ${busted ? "grayscale brightness-50 border-red-900/50" : "shadow-amber-900/20"}`;
        case "action":
            return `${base} from-red-500/10 to-red-900/40 border-red-500/30 text-red-100 ${busted ? "grayscale brightness-50 border-red-900/50" : "shadow-red-900/20"}`;
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

export default function PlayerHand({
    cards,
    hasSecondChance,
    status,
    onRemoveCard,
    isOwnHand = false,
}: PlayerHandProps) {
    const score = calculateScore(cards);
    const busted = isBusted(cards);
    const flipSeven = hasFlipSeven(cards);

    return (
        <div className="space-y-4">
            {/* Score Display */}
            <div className="flex items-center justify-between bg-black/20 rounded-2xl p-4 border border-white/5 backdrop-blur-sm shadow-inner">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted/40 uppercase tracking-widest mb-1">
                        Current Points
                    </span>
                    <div className="flex items-baseline gap-2">
                        <motion.span
                            key={score}
                            initial={{ scale: 1.2, filter: "brightness(2)" }}
                            animate={{
                                scale: 1,
                                filter: "brightness(1)",
                                color: busted ? "#ef4444" : "#f59e0b"
                            }}
                            className="text-4xl font-black font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        >
                            {busted ? 0 : score}
                        </motion.span>
                        <span className="text-muted/60 text-xs font-bold uppercase tracking-tight">Points</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {hasSecondChance && (
                        <motion.span
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-black uppercase tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                        >
                            <Shield className="w-3 h-3" />
                            Shield Active
                        </motion.span>
                    )}

                    {flipSeven && !busted && (
                        <motion.span
                            initial={{ scale: 0, rotate: -5 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="px-3 py-1 bg-gradient-to-r from-gold/20 to-amber-500/20 border border-gold/30 rounded-full text-gold text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(212,168,67,0.2)]"
                        >
                            🎯 FLIP 7! +15
                        </motion.span>
                    )}

                    {status !== "active" && (
                        <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${status === "busted"
                                ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                                : status === "stayed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                                }`}
                        >
                            {status === "busted"
                                ? "BUSTED"
                                : status === "stayed"
                                    ? "LOCKED"
                                    : "FROZEN"}
                        </span>
                    )}
                </div>
            </div>

            {/* Cards */}
            <div className="flex flex-wrap gap-2 min-h-[80px]">
                <AnimatePresence mode="popLayout">
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.8, rotate: -5 }}
                            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 5 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                                delay: index * 0.05
                            }}
                            className={getCardStyle(card, busted)}
                        >
                            <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                {getCardLabel(card)}
                            </span>

                            {/* Texture overlay */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] pointer-events-none" />

                            {/* Inner shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 pointer-events-none" />

                            {/* Remove button for own hand */}
                            {isOwnHand && onRemoveCard && status === "active" && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveCard(card.id)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 transition-colors z-20 shadow-lg border border-red-400/50"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {cards.length === 0 && (
                    <div className="text-muted text-sm italic py-3">No cards drawn</div>
                )}
            </div>
        </div>
    );
}
