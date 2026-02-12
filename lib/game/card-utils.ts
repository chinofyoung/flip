import type { Card } from "@/lib/firestore-schema";

/**
 * Returns the tailwind text color class for a card type
 */
export function getCardTextColor(card: Card): string {
    if (card.type === "action") return "text-red-400";
    if (card.type === "modifier") return "text-blue-400";
    return "text-emerald";
}

/**
 * Returns the full tailwind class string for a card's visual style
 */
export function getCardStyle(card: Card, busted: boolean = false): string {
    const base =
        "relative w-12 h-16 rounded-xl bg-gradient-to-br border flex items-center justify-center font-bold text-sm shadow-lg ring-1 ring-inset ring-white/5 transition-all";

    switch (card.type) {
        case "number":
            return `${base} from-blue-500/10 to-blue-900/40 border-blue-500/30 text-blue-100 ${busted
                ? "grayscale brightness-50 border-red-900/50"
                : "shadow-blue-900/20"
                }`;
        case "modifier":
            return `${base} from-amber-500/10 to-amber-900/40 border-amber-500/30 text-amber-100 ${busted
                ? "grayscale brightness-50 border-red-900/50"
                : "shadow-amber-900/20"
                }`;
        case "action":
            return `${base} from-red-500/10 to-red-900/40 border-red-500/30 text-red-100 ${busted
                ? "grayscale brightness-50 border-red-900/50"
                : "shadow-red-900/20"
                }`;
    }
}

/**
 * Returns a human-readable label for a card
 */
export function getCardLabel(card: Card): string {
    if (card.type === "number") return card.value.toString();
    if (card.type === "modifier") {
        if (card.value === "x2") return "×2";
        return card.value as string;
    }
    if (card.value === "freeze") return "❄️";
    if (card.value === "flip-three") return "3×";
    if (card.value === "second-chance") return "❤️";
    return card.label;
}
