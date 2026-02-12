import { Card } from "@/lib/firestore-schema";

/**
 * Filters hand to only number cards.
 */
export function getNumberCards(hand: Card[]): Card[] {
  return hand.filter((card) => card.type === "number");
}

/**
 * Filters hand to only modifier cards.
 */
export function getModifierCards(hand: Card[]): Card[] {
  return hand.filter((card) => card.type === "modifier");
}

/**
 * Returns array of unique number values from number cards in hand.
 */
export function getUniqueNumberValues(hand: Card[]): number[] {
  const numberCards = getNumberCards(hand);
  const values = numberCards.map((card) => card.value as number);
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

/**
 * Checks if hand has exactly 7 or more unique number card values.
 * Returns true if Flip 7 bonus applies.
 */
export function hasFlipSeven(hand: Card[]): boolean {
  return getUniqueNumberValues(hand).length >= 7;
}

/**
 * Checks if hand is busted (contains duplicate number card values).
 * A hand is busted if it has two or more number cards with the same value.
 * Action and modifier cards never cause busts.
 */
export function isBusted(hand: Card[]): boolean {
  const numberCards = getNumberCards(hand);
  const values = numberCards.map((card) => card.value as number);

  // Check for duplicates by comparing Set size to array length
  return new Set(values).size < values.length;
}

/**
 * Calculates the total score for a hand following Flip 7 scoring rules.
 *
 * Scoring order:
 * 1. Sum all number card values
 * 2. Apply x2 multipliers (stack multiplicatively)
 * 3. Apply additive bonuses (+2, +4, +10)
 * 4. Add Flip 7 bonus (+15) if 7+ unique number values
 *
 * Edge cases:
 * - Empty hand returns 0
 * - Hand with only modifiers/actions returns 0
 * - Multiple x2 cards stack (two x2 = x4)
 * - 0-value number cards count toward Flip 7 but contribute 0 to sum
 */
export function calculateScore(hand: Card[]): number {
  if (hand.length === 0) {
    return 0;
  }

  // Step 1: Sum all number card values
  const numberCards = getNumberCards(hand);
  let score = numberCards.reduce((sum, card) => sum + (card.value as number), 0);

  // Step 2: Apply x2 multipliers (multiplicatively)
  const modifierCards = getModifierCards(hand);
  const x2Count = modifierCards.filter((card) => card.value === "x2").length;
  if (x2Count > 0) {
    score *= Math.pow(2, x2Count);
  }

  // Step 3: Apply additive modifiers
  const additiveModifiers = modifierCards.filter((card) =>
    card.value === "+2" || card.value === "+4" || card.value === "+10"
  );

  for (const modifier of additiveModifiers) {
    const bonusValue = parseInt((modifier.value as string).substring(1));
    score += bonusValue;
  }

  // Step 4: Check for Flip 7 bonus
  if (hasFlipSeven(hand)) {
    score += 15;
  }

  return score;
}
