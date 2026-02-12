import { describe, it, expect } from "vitest";
import {
  applyFreeze,
  applySecondChance,
  resolveCardDraw,
} from "@/lib/game/actions";
import type { Card, PlayerHand } from "@/lib/firestore-schema";

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

// Helper function to create test hands
function makeHand(overrides?: Partial<PlayerHand>): PlayerHand {
  return {
    cards: [],
    score: 0,
    status: "active",
    hasSecondChance: false,
    ...overrides,
  };
}

describe("applyFreeze", () => {
  it("should return hand with status frozen", () => {
    const hand = makeHand({
      cards: [makeCard({ type: "number", value: 5 })],
      score: 5,
      status: "active",
    });

    const frozenHand = applyFreeze(hand);

    expect(frozenHand.status).toBe("frozen");
  });

  it("should preserve existing cards", () => {
    const cards = [
      makeCard({ type: "number", value: 3 }),
      makeCard({ type: "number", value: 7 }),
    ];
    const hand = makeHand({ cards, score: 10 });

    const frozenHand = applyFreeze(hand);

    expect(frozenHand.cards).toEqual(cards);
  });

  it("should preserve existing score", () => {
    const hand = makeHand({
      cards: [makeCard({ type: "number", value: 8 })],
      score: 8,
    });

    const frozenHand = applyFreeze(hand);

    expect(frozenHand.score).toBe(8);
  });

  it("should preserve hasSecondChance flag", () => {
    const hand = makeHand({
      cards: [makeCard({ type: "number", value: 5 })],
      score: 5,
      hasSecondChance: true,
    });

    const frozenHand = applyFreeze(hand);

    expect(frozenHand.hasSecondChance).toBe(true);
  });
});

describe("applySecondChance", () => {
  it("should set hasSecondChance to true", () => {
    const hand = makeHand({
      cards: [makeCard({ type: "number", value: 5 })],
      score: 5,
      hasSecondChance: false,
    });

    const updatedHand = applySecondChance(hand);

    expect(updatedHand.hasSecondChance).toBe(true);
  });

  it("should preserve existing cards", () => {
    const cards = [
      makeCard({ type: "number", value: 2 }),
      makeCard({ type: "modifier", value: "x2" }),
    ];
    const hand = makeHand({ cards, score: 4 });

    const updatedHand = applySecondChance(hand);

    expect(updatedHand.cards).toEqual(cards);
  });

  it("should preserve existing status", () => {
    const hand = makeHand({
      cards: [makeCard({ type: "number", value: 5 })],
      score: 5,
      status: "active",
    });

    const updatedHand = applySecondChance(hand);

    expect(updatedHand.status).toBe("active");
  });

  it("should work when hasSecondChance is already true", () => {
    const hand = makeHand({
      cards: [makeCard({ type: "number", value: 5 })],
      score: 5,
      hasSecondChance: true,
    });

    const updatedHand = applySecondChance(hand);

    expect(updatedHand.hasSecondChance).toBe(true);
  });
});

describe("resolveCardDraw", () => {
  describe("drawing number cards", () => {
    it("should add card and update score when drawing a number card", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 3 })],
        score: 3,
      });

      const drawnCard = makeCard({ type: "number", value: 5 });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.cards).toHaveLength(2);
      expect(result.hand.cards[1]).toEqual(drawnCard);
      expect(result.hand.score).toBe(8);
      expect(result.hand.status).toBe("active");
      expect(result.actionRequired).toBeNull();
    });

    it("should set status to busted when drawing a duplicate number", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 5 })],
        score: 5,
      });

      const drawnCard = makeCard({ type: "number", value: 5 });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.status).toBe("busted");
      expect(result.hand.cards).toHaveLength(2);
      expect(result.actionRequired).toBeNull();
    });

    it("should consume Second Chance shield and remove duplicate when drawing duplicate with Second Chance", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 5 })],
        score: 5,
        hasSecondChance: true,
      });

      const drawnCard = makeCard({ type: "number", value: 5 });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.hasSecondChance).toBe(false);
      expect(result.hand.status).toBe("active");
      expect(result.hand.cards).toHaveLength(1);
      expect(result.hand.cards[0].value).toBe(5);
      // Score should still be 5 (original card remains)
      expect(result.hand.score).toBe(5);
      expect(result.actionRequired).toBeNull();
    });

    it("should recalculate score after adding number card", () => {
      const hand = makeHand({
        cards: [
          makeCard({ type: "number", value: 2 }),
          makeCard({ type: "modifier", value: "x2" }),
        ],
        score: 4, // 2 * 2 = 4
      });

      const drawnCard = makeCard({ type: "number", value: 3 });
      const result = resolveCardDraw(hand, drawnCard);

      // (2 + 3) * 2 = 10
      expect(result.hand.score).toBe(10);
    });
  });

  describe("drawing action cards", () => {
    it("should freeze hand when drawing Freeze action card", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 7 })],
        score: 7,
        status: "active",
      });

      const drawnCard = makeCard({ type: "action", value: "freeze" });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.status).toBe("frozen");
      expect(result.hand.cards).toHaveLength(2);
      expect(result.actionRequired).toBeNull();
    });

    it("should activate Second Chance when drawing Second Chance action card", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 4 })],
        score: 4,
        hasSecondChance: false,
      });

      const drawnCard = makeCard({
        type: "action",
        value: "second-chance",
      });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.hasSecondChance).toBe(true);
      expect(result.hand.cards).toHaveLength(2);
      expect(result.hand.status).toBe("active");
      expect(result.actionRequired).toBeNull();
    });

    it("should return actionRequired when drawing Flip Three action card", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 6 })],
        score: 6,
      });

      const drawnCard = makeCard({ type: "action", value: "flip-three" });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.cards).toHaveLength(2);
      expect(result.actionRequired).toEqual({ type: "flip-three" });
    });
  });

  describe("drawing modifier cards", () => {
    it("should add modifier card and update score", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 5 })],
        score: 5,
      });

      const drawnCard = makeCard({ type: "modifier", value: "x2" });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.cards).toHaveLength(2);
      expect(result.hand.score).toBe(10); // 5 * 2
      expect(result.hand.status).toBe("active");
      expect(result.actionRequired).toBeNull();
    });

    it("should handle additive modifier cards", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 3 })],
        score: 3,
      });

      const drawnCard = makeCard({ type: "modifier", value: "+10" });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.cards).toHaveLength(2);
      expect(result.hand.score).toBe(13); // 3 + 10
    });

    it("should recalculate score correctly with multiple modifiers", () => {
      const hand = makeHand({
        cards: [
          makeCard({ type: "number", value: 4 }),
          makeCard({ type: "modifier", value: "x2" }),
        ],
        score: 8, // 4 * 2
      });

      const drawnCard = makeCard({ type: "modifier", value: "+2" });
      const result = resolveCardDraw(hand, drawnCard);

      // 4 * 2 + 2 = 10
      expect(result.hand.score).toBe(10);
    });
  });

  describe("edge cases", () => {
    it("should handle drawing into empty hand", () => {
      const hand = makeHand();

      const drawnCard = makeCard({ type: "number", value: 7 });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.cards).toHaveLength(1);
      expect(result.hand.score).toBe(7);
      expect(result.hand.status).toBe("active");
    });

    it("should handle drawing 0-value number card", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 5 })],
        score: 5,
      });

      const drawnCard = makeCard({ type: "number", value: 0 });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.cards).toHaveLength(2);
      expect(result.hand.score).toBe(5); // 5 + 0
    });

    it("should bust even with 0-value duplicate", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 0 })],
        score: 0,
      });

      const drawnCard = makeCard({ type: "number", value: 0 });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.status).toBe("busted");
    });

    it("should handle Flip 7 bonus when drawing 7th unique number", () => {
      const hand = makeHand({
        cards: [
          makeCard({ type: "number", value: 0 }),
          makeCard({ type: "number", value: 1 }),
          makeCard({ type: "number", value: 2 }),
          makeCard({ type: "number", value: 3 }),
          makeCard({ type: "number", value: 4 }),
          makeCard({ type: "number", value: 5 }),
        ],
        score: 15, // 0+1+2+3+4+5
      });

      const drawnCard = makeCard({ type: "number", value: 6 });
      const result = resolveCardDraw(hand, drawnCard);

      // (0+1+2+3+4+5+6) + 15 = 21 + 15 = 36
      expect(result.hand.score).toBe(36);
    });

    it("should preserve score when drawing causes bust", () => {
      const hand = makeHand({
        cards: [
          makeCard({ type: "number", value: 3 }),
          makeCard({ type: "number", value: 7 }),
        ],
        score: 10,
      });

      const drawnCard = makeCard({ type: "number", value: 3 });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.status).toBe("busted");
      // Score is recalculated even when busted
      expect(result.hand.score).toBe(13); // 3 + 7 + 3
    });

    it("should handle multiple Second Chance scenarios correctly", () => {
      // First, activate Second Chance
      const hand1 = makeHand({
        cards: [makeCard({ type: "number", value: 5 })],
        score: 5,
      });

      const secondChanceCard = makeCard({
        type: "action",
        value: "second-chance",
      });
      const result1 = resolveCardDraw(hand1, secondChanceCard);

      expect(result1.hand.hasSecondChance).toBe(true);

      // Then, draw a duplicate (should consume shield)
      const duplicateCard = makeCard({ type: "number", value: 5 });
      const result2 = resolveCardDraw(result1.hand, duplicateCard);

      expect(result2.hand.hasSecondChance).toBe(false);
      expect(result2.hand.status).toBe("active");

      // Draw another duplicate (should bust this time)
      const anotherDuplicate = makeCard({ type: "number", value: 5 });
      const result3 = resolveCardDraw(result2.hand, anotherDuplicate);

      expect(result3.hand.status).toBe("busted");
    });

    it("should not set actionRequired for non-flip-three cards", () => {
      const testCases = [
        makeCard({ type: "number", value: 5 }),
        makeCard({ type: "modifier", value: "x2" }),
        makeCard({ type: "action", value: "freeze" }),
        makeCard({ type: "action", value: "second-chance" }),
      ];

      testCases.forEach((card) => {
        const hand = makeHand();
        const result = resolveCardDraw(hand, card);
        expect(result.actionRequired).toBeNull();
      });
    });

    it("should handle complex scenario: modifiers + Flip 7 + Second Chance", () => {
      const hand = makeHand({
        cards: [
          makeCard({ type: "number", value: 0 }),
          makeCard({ type: "number", value: 1 }),
          makeCard({ type: "number", value: 2 }),
          makeCard({ type: "number", value: 3 }),
          makeCard({ type: "number", value: 4 }),
          makeCard({ type: "number", value: 5 }),
          makeCard({ type: "modifier", value: "x2" }),
        ],
        score: 30, // (0+1+2+3+4+5) * 2 = 30
        hasSecondChance: true,
      });

      // Draw the 7th unique number for Flip 7
      const drawnCard = makeCard({ type: "number", value: 6 });
      const result = resolveCardDraw(hand, drawnCard);

      // (0+1+2+3+4+5+6) * 2 + 15 = 42 + 15 = 57
      expect(result.hand.score).toBe(57);
      expect(result.hand.hasSecondChance).toBe(true);
      expect(result.hand.status).toBe("active");
    });
  });
});
