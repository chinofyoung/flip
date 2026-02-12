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
    { value: "freeze" as const, label: "❄️", type: "action" as const },
    { value: "flip-three" as const, label: "F3", type: "action" as const },
    { value: "second-chance" as const, label: "❤️", type: "action" as const },
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

const CARD_BASE_CLASSES = "relative aspect-[3/4] rounded-xl flex flex-col items-center justify-center font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed group overflow-hidden";

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
        <div className="space-y-6">
            {/* Number Cards */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-blue-500/20" />
                    <h3 className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.2em]">
                        Number Cards
                    </h3>
                    <div className="h-px flex-1 bg-blue-500/20" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {NUMBER_CARDS.map((card) => (
                        <motion.button
                            key={card.value}
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ y: -2 }}
                            onClick={() => handleSelect("number", card.value, card.label)}
                            disabled={disabled}
                            className={`${CARD_BASE_CLASSES} bg-gradient-to-br from-blue-500/10 to-blue-900/30 border border-blue-500/20 ring-1 ring-inset ring-white/5 shadow-lg shadow-blue-900/10 hover:border-blue-400/40 hover:from-blue-500/20 hover:to-blue-900/40`}
                        >
                            <span className="text-blue-200 text-lg sm:text-xl drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                                {card.label}
                            </span>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-400/10 blur-md rounded-full group-hover:bg-blue-400/20 transition-colors" />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Modifier Cards */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-amber-500/20" />
                    <h3 className="text-[10px] font-black text-amber-400/60 uppercase tracking-[0.2em]">
                        Modifiers
                    </h3>
                    <div className="h-px flex-1 bg-amber-500/20" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {MODIFIER_CARDS.map((card) => (
                        <motion.button
                            key={card.value}
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ y: -2 }}
                            onClick={() => handleSelect("modifier", card.value, card.label)}
                            disabled={disabled}
                            className={`${CARD_BASE_CLASSES} bg-gradient-to-br from-amber-500/10 to-amber-900/30 border border-amber-500/20 ring-1 ring-inset ring-white/5 shadow-lg shadow-amber-900/10 hover:border-amber-400/40 hover:from-amber-500/20 hover:to-amber-900/40`}
                        >
                            <span className="text-amber-200 text-base sm:text-lg drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                                {card.label}
                            </span>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
                            <div className="absolute top-1 left-1 w-6 h-6 bg-amber-400/10 blur-lg rounded-full" />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Action Cards */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-red-500/20" />
                    <h3 className="text-[10px] font-black text-red-400/60 uppercase tracking-[0.2em]">
                        Actions
                    </h3>
                    <div className="h-px flex-1 bg-red-500/20" />
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {ACTION_CARDS.map((card) => (
                        <motion.button
                            key={card.value}
                            type="button"
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ y: -2 }}
                            onClick={() => handleSelect("action", card.value, card.label)}
                            disabled={disabled}
                            className={`${CARD_BASE_CLASSES} bg-gradient-to-br from-red-500/10 to-red-900/30 border border-red-500/20 ring-1 ring-inset ring-white/5 shadow-lg shadow-red-900/10 hover:border-red-400/40 hover:from-red-500/20 hover:to-red-900/40`}
                        >
                            <span className="text-red-200 text-xs sm:text-sm uppercase tracking-tight text-center px-1 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                                {card.label}
                            </span>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-500/5 to-transparent pointer-events-none" />
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
