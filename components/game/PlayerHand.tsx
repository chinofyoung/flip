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

function getCardColor(card: Card) {
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
        <div className="space-y-3">
            {/* Score Display */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <motion.span
                        key={score}
                        initial={{ scale: 1.3, color: "#d4a843" }}
                        animate={{ scale: 1, color: busted ? "#ef4444" : "#f0ead6" }}
                        className="text-3xl font-bold font-mono"
                    >
                        {busted ? 0 : score}
                    </motion.span>
                    <span className="text-muted text-sm">pts</span>
                </div>

                <div className="flex items-center gap-2">
                    {hasSecondChance && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald/10 border border-emerald/20 rounded-full text-emerald text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            Shield
                        </span>
                    )}

                    {flipSeven && !busted && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-1 bg-gold/20 border border-gold/30 rounded-full text-gold text-xs font-bold"
                        >
                            🎯 FLIP 7! +15
                        </motion.span>
                    )}

                    {status !== "active" && (
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${status === "busted"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : status === "stayed"
                                    ? "bg-emerald/20 text-emerald border border-emerald/30"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                }`}
                        >
                            {status === "busted"
                                ? "BUST"
                                : status === "stayed"
                                    ? "LOCKED IN"
                                    : "FROZEN"}
                        </span>
                    )}
                </div>
            </div>

            {/* Cards */}
            <div className="flex flex-wrap gap-1.5">
                <AnimatePresence mode="popLayout">
                    {cards.map((card) => (
                        <motion.div
                            key={card.id}
                            layout
                            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`relative w-12 h-16 rounded-lg bg-gradient-to-br border flex items-center justify-center font-bold text-sm ${getCardColor(card)} ${busted && card.type === "number" ? "ring-2 ring-red-500/50" : ""
                                }`}
                        >
                            {getCardLabel(card)}

                            {/* Remove button for own hand */}
                            {isOwnHand && onRemoveCard && status === "active" && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveCard(card.id)}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                                >
                                    <X className="w-2.5 h-2.5 text-white" />
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
