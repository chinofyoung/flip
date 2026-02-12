import { Card, CardType, ModifierValue, ActionValue } from "@/lib/firestore-schema";

/**
 * Flip 7 - Full 99-card deck definition
 *
 * Deck composition:
 * - Number cards: 0 (3x), 1 (1x), 2 (2x), 3 (3x), ..., 12 (12x) = 81 cards
 * - Modifier cards: +2 (3x), +4 (2x), +10 (1x), x2 (3x) = 9 cards
 * - Action cards: Freeze (3x), Flip Three (3x), Second Chance (3x) = 9 cards
 * Total: 99 cards
 *
 * NOTE: The plan originally estimated 94 cards. The actual count per the
 * specified distribution is 99. Verify against physical deck if counts differ.
 */

// Generate the complete deck
function generateDeck(): Card[] {
  const cards: Card[] = [];

  // Number cards: 0-12
  // Special case: 0 has 3 copies
  // General rule: face value N has N copies (1-12)
  for (let value = 0; value <= 12; value++) {
    const count = value === 0 ? 3 : value;
    for (let copy = 1; copy <= count; copy++) {
      cards.push({
        id: `num-${value}-${copy}`,
        type: "number",
        value: value,
        label: value.toString(),
      });
    }
  }

  // Modifier cards
  const modifiers: Array<{ value: ModifierValue; count: number }> = [
    { value: "+2", count: 3 },
    { value: "+4", count: 2 },
    { value: "+10", count: 1 },
    { value: "x2", count: 3 },
  ];

  for (const { value, count } of modifiers) {
    for (let copy = 1; copy <= count; copy++) {
      const idSuffix = value.replace("+", "plus").replace("x", "mult");
      cards.push({
        id: `mod-${idSuffix}-${copy}`,
        type: "modifier",
        value: value,
        label: value,
      });
    }
  }

  // Action cards
  const actions: Array<{ value: ActionValue; label: string; count: number }> = [
    { value: "freeze", label: "Freeze", count: 3 },
    { value: "flip-three", label: "Flip Three", count: 3 },
    { value: "second-chance", label: "Second Chance", count: 3 },
  ];

  for (const { value, label, count } of actions) {
    for (let copy = 1; copy <= count; copy++) {
      cards.push({
        id: `act-${value}-${copy}`,
        type: "action",
        value: value,
        label: label,
      });
    }
  }

  return cards;
}

// The complete deck
export const FULL_DECK: Card[] = generateDeck();

// Deck size constant
export const DECK_SIZE: number = FULL_DECK.length;

/**
 * Get all cards of a specific type from the deck
 */
export function getCardsByType(type: CardType): Card[] {
  return FULL_DECK.filter((card) => card.type === type);
}

/**
 * Type guard: Check if a card is a number card
 */
export function isNumberCard(card: Card): boolean {
  return card.type === "number";
}

/**
 * Type guard: Check if a card is a modifier card
 */
export function isModifierCard(card: Card): boolean {
  return card.type === "modifier";
}

/**
 * Type guard: Check if a card is an action card
 */
export function isActionCard(card: Card): boolean {
  return card.type === "action";
}
