"use client";

import { motion } from "framer-motion";
import type { Card, ModifierValue, ActionValue } from "@/lib/firestore-schema";
import { hapticLight } from "@/lib/haptics";

// Unique card definitions for the picker (one of each type)
const NUMBER_CARDS = Array.from({ length: 13 }, (_, i) => ({
    value: i,
    label: i.toString(),
    type: "number" as const,
}));

const MODIFIER_CARDS = [
    { value: "+2" as const, label: "+2", type: "modifier" as const },
    { value: "+4" as const, label: "+4", type: "modifier" as const },
    { value: "+10" as const, label: "+10", type: "modifier" as const },
    { value: "x2" as const, label: "×2", type: "modifier" as const },
];

const ACTION_CARDS = [
    { value: "freeze" as const, label: "Freeze", type: "action" as const },
    { value: "flip-three" as const, label: "Flip 3", type: "action" as const },
    { value: "second-chance" as const, label: "2nd Chance", type: "action" as const },
];

interface CardPickerProps {
    onCardSelect: (card: Card) => void;
    disabled?: boolean;
}

// Generate unique IDs for cards added to hand
let cardCounter = 0;
function generateCardId(type: string, value: string | number): string {
    cardCounter++;
    return `${type}-${value}-pick-${cardCounter}-${Date.now()}`;
}

export default function CardPicker({ onCardSelect, disabled }: CardPickerProps) {
    const handleSelect = (
        type: "number" | "modifier" | "action",
        value: number | ModifierValue | ActionValue,
        label: string
    ) => {
        if (disabled) return;
        hapticLight();

        const card: Card = {
            id: generateCardId(type, String(value)),
            type,
            value,
            label,
        };
        onCardSelect(card);
    };

    return (
        <div className="space-y-4">
            {/* Number Cards */}
            <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Number Cards
                </h3>
                <div className="grid grid-cols-7 gap-1.5">
                    {NUMBER_CARDS.map((card) => (
                        <motion.button
                            key={card.value}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSelect("number", card.value, card.label)}
                            disabled={disabled}
                            className="aspect-[3/4] rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-lg hover:from-blue-500/30 hover:to-blue-700/30 hover:border-blue-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:bg-blue-500/40"
                        >
                            {card.label}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Modifier Cards */}
            <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Modifiers
                </h3>
                <div className="grid grid-cols-4 gap-1.5">
                    {MODIFIER_CARDS.map((card) => (
                        <motion.button
                            key={card.value}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSelect("modifier", card.value, card.label)}
                            disabled={disabled}
                            className="aspect-[3/4] rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-base hover:from-amber-500/30 hover:to-amber-700/30 hover:border-amber-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:bg-amber-500/40"
                        >
                            {card.label}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Action Cards */}
            <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Actions
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                    {ACTION_CARDS.map((card) => (
                        <motion.button
                            key={card.value}
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleSelect("action", card.value, card.label)}
                            disabled={disabled}
                            className="aspect-[3/4] rounded-lg bg-gradient-to-br from-red-500/20 to-red-700/20 border border-red-500/30 flex items-center justify-center text-red-300 font-bold text-sm hover:from-red-500/30 hover:to-red-700/30 hover:border-red-400/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:bg-red-500/40"
                        >
                            {card.label}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
