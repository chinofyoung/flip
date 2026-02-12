import { describe, it, expect } from "vitest";
import {
  calculateScore,
  isBusted,
  hasFlipSeven,
  getNumberCards,
  getModifierCards,
  getUniqueNumberValues,
} from "@/lib/game/scoring";
import type { Card } from "@/lib/firestore-schema";

// Helper function to create test cards
function makeCard(
  overrides: Partial<Card> & { type: Card["type"]; value: Card["value"] }
): Card {
  return {
    id: `test-${overrides.type}-${overrides.value}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    label: String(overrides.value),
    ...overrides,
  };
}

describe("calculateScore", () => {
  it("should return 0 for empty hand", () => {
    expect(calculateScore([])).toBe(0);
  });

  it("should return correct score for single number card", () => {
    const hand = [makeCard({ type: "number", value: 5 })];
    expect(calculateScore(hand)).toBe(5);
  });

  it("should sum multiple number cards correctly", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 7 }),
      makeCard({ type: "number", value: 2 }),
    ];
    expect(calculateScore(hand)).toBe(12);
  });

  it("should double the sum with one x2 modifier", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 7 }),
      makeCard({ type: "modifier", value: "x2" }),
    ];
    // (3 + 7) * 2 = 20
    expect(calculateScore(hand)).toBe(20);
  });

  it("should quadruple the sum with two x2 modifiers", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 7 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "x2" }),
    ];
    // (3 + 7) * 2 * 2 = 40
    expect(calculateScore(hand)).toBe(40);
  });

  it("should add +2 modifier after multiplication", () => {
    const hand = [
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "modifier", value: "+2" }),
    ];
    // 5 + 2 = 7
    expect(calculateScore(hand)).toBe(7);
  });

  it("should add +10 modifier correctly", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "modifier", value: "+10" }),
    ];
    // 3 + 10 = 13
    expect(calculateScore(hand)).toBe(13);
  });

  it("should apply combined modifiers in correct order: numbers + x2 + additive", () => {
    const hand = [
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "+4" }),
    ];
    // (5 + 3) * 2 + 4 = 16 + 4 = 20
    expect(calculateScore(hand)).toBe(20);
  });

  it("should return 0 for hand with only modifiers", () => {
    const hand = [
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "+2" }),
      makeCard({ type: "modifier", value: "+10" }),
    ];
    // No numbers to modify: 0 * 2 + 2 + 10 = 12
    expect(calculateScore(hand)).toBe(12);
  });

  it("should handle 0-value number cards", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 5 }),
    ];
    // 0 + 5 = 5
    expect(calculateScore(hand)).toBe(5);
  });

  it("should apply Flip 7 bonus for 7 unique number values", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 6 }),
    ];
    // (0+1+2+3+4+5+6) + 15 = 21 + 15 = 36
    expect(calculateScore(hand)).toBe(36);
  });

  it("should apply Flip 7 bonus with modifiers correctly", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 6 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "+2" }),
    ];
    // (0+1+2+3+4+5+6) * 2 + 2 + 15 = 21 * 2 + 2 + 15 = 42 + 2 + 15 = 59
    expect(calculateScore(hand)).toBe(59);
  });

  it("should ignore action cards in scoring", () => {
    const hand = [
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "action", value: "freeze" }),
      makeCard({ type: "action", value: "second-chance" }),
    ];
    expect(calculateScore(hand)).toBe(5);
  });

  it("should handle multiple additive modifiers", () => {
    const hand = [
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "modifier", value: "+2" }),
      makeCard({ type: "modifier", value: "+4" }),
      makeCard({ type: "modifier", value: "+10" }),
    ];
    // 5 + 2 + 4 + 10 = 21
    expect(calculateScore(hand)).toBe(21);
  });

  it("should handle complex scenario: multiple numbers, multiple multipliers, multiple additives, Flip 7", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 6 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "+2" }),
      makeCard({ type: "modifier", value: "+10" }),
    ];
    // (0+1+2+3+4+5+6) * 4 + 2 + 10 + 15 = 21 * 4 + 27 = 84 + 27 = 111
    expect(calculateScore(hand)).toBe(111);
  });
});

describe("isBusted", () => {
  it("should return false for empty hand", () => {
    expect(isBusted([])).toBe(false);
  });

  it("should return false for all unique number values", () => {
    const hand = [
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
    ];
    expect(isBusted(hand)).toBe(false);
  });

  it("should return true for two cards with same number value", () => {
    const hand = [
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 5 }),
    ];
    expect(isBusted(hand)).toBe(true);
  });

  it("should return true for multiple duplicates", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 7 }),
      makeCard({ type: "number", value: 5 }),
    ];
    expect(isBusted(hand)).toBe(true);
  });

  it("should return true when same number appears from two different copies", () => {
    const hand = [
      makeCard({
        type: "number",
        value: 5,
        id: "num-5-1",
        label: "5",
      }),
      makeCard({
        type: "number",
        value: 5,
        id: "num-5-2",
        label: "5",
      }),
    ];
    expect(isBusted(hand)).toBe(true);
  });

  it("should not bust from non-number cards even if duplicated", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "action", value: "freeze" }),
      makeCard({ type: "action", value: "freeze" }),
    ];
    expect(isBusted(hand)).toBe(false);
  });

  it("should return false for mix of unique numbers and modifiers", () => {
    const hand = [
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "modifier", value: "+2" }),
      makeCard({ type: "modifier", value: "x2" }),
    ];
    expect(isBusted(hand)).toBe(false);
  });

  it("should return false for hand with only modifiers", () => {
    const hand = [
      makeCard({ type: "modifier", value: "+2" }),
      makeCard({ type: "modifier", value: "x2" }),
    ];
    expect(isBusted(hand)).toBe(false);
  });

  it("should return false for hand with only action cards", () => {
    const hand = [
      makeCard({ type: "action", value: "freeze" }),
      makeCard({ type: "action", value: "second-chance" }),
    ];
    expect(isBusted(hand)).toBe(false);
  });
});

describe("hasFlipSeven", () => {
  it("should return false for hand with 6 unique numbers", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
    ];
    expect(hasFlipSeven(hand)).toBe(false);
  });

  it("should return true for hand with exactly 7 unique numbers", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 6 }),
    ];
    expect(hasFlipSeven(hand)).toBe(true);
  });

  it("should return true for hand with 8+ unique numbers", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 6 }),
      makeCard({ type: "number", value: 7 }),
    ];
    expect(hasFlipSeven(hand)).toBe(true);
  });

  it("should not count duplicate number values twice", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 5 }), // duplicate
    ];
    expect(hasFlipSeven(hand)).toBe(false);
  });

  it("should count 0-value cards as a unique value", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 6 }),
    ];
    expect(hasFlipSeven(hand)).toBe(true);
  });

  it("should return false for empty hand", () => {
    expect(hasFlipSeven([])).toBe(false);
  });

  it("should ignore non-number cards", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 4 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 6 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "action", value: "freeze" }),
    ];
    expect(hasFlipSeven(hand)).toBe(true);
  });
});

describe("getNumberCards", () => {
  it("should filter and return only number cards", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "action", value: "freeze" }),
    ];
    const numberCards = getNumberCards(hand);
    expect(numberCards).toHaveLength(2);
    expect(numberCards[0].type).toBe("number");
    expect(numberCards[1].type).toBe("number");
  });

  it("should return empty array when no number cards", () => {
    const hand = [
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "action", value: "freeze" }),
    ];
    expect(getNumberCards(hand)).toEqual([]);
  });

  it("should return all cards when all are number cards", () => {
    const hand = [
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 3 }),
    ];
    expect(getNumberCards(hand)).toHaveLength(3);
  });
});

describe("getModifierCards", () => {
  it("should filter and return only modifier cards", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "+2" }),
      makeCard({ type: "action", value: "freeze" }),
    ];
    const modifierCards = getModifierCards(hand);
    expect(modifierCards).toHaveLength(2);
    expect(modifierCards[0].type).toBe("modifier");
    expect(modifierCards[1].type).toBe("modifier");
  });

  it("should return empty array when no modifier cards", () => {
    const hand = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "action", value: "freeze" }),
    ];
    expect(getModifierCards(hand)).toEqual([]);
  });

  it("should return all cards when all are modifier cards", () => {
    const hand = [
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "modifier", value: "+2" }),
      makeCard({ type: "modifier", value: "+10" }),
    ];
    expect(getModifierCards(hand)).toHaveLength(3);
  });
});

describe("getUniqueNumberValues", () => {
  it("should return sorted unique number values", () => {
    const hand = [
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "number", value: 8 }),
      makeCard({ type: "number", value: 2 }),
    ];
    expect(getUniqueNumberValues(hand)).toEqual([2, 5, 8]);
  });

  it("should return empty array for no number cards", () => {
    const hand = [
      makeCard({ type: "modifier", value: "x2" }),
      makeCard({ type: "action", value: "freeze" }),
    ];
    expect(getUniqueNumberValues(hand)).toEqual([]);
  });

  it("should include 0-value cards", () => {
    const hand = [
      makeCard({ type: "number", value: 0 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 2 }),
    ];
    expect(getUniqueNumberValues(hand)).toEqual([0, 1, 2]);
  });

  it("should deduplicate and sort correctly", () => {
    const hand = [
      makeCard({ type: "number", value: 9 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 5 }),
      makeCard({ type: "number", value: 1 }),
      makeCard({ type: "number", value: 9 }),
    ];
    expect(getUniqueNumberValues(hand)).toEqual([1, 5, 9]);
  });
});
