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
      expect(result.hand.score).toBe(5);
      expect(result.actionRequired).toBeNull();
    });
  });

  describe("drawing action cards", () => {
    it("should return actionRequired when drawing Freeze action card (deferred behavior)", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 7 })],
        score: 7,
      });

      const drawnCard = makeCard({ type: "action", value: "freeze" });
      const result = resolveCardDraw(hand, drawnCard);

      // Effect is deferred to modal
      expect(result.hand.status).toBe("active");
      expect(result.hand.cards).toHaveLength(2);
      expect(result.actionRequired).toEqual({ type: "freeze" });
    });

    it("should auto-activate Second Chance if not guarded", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 4 })],
        score: 4,
        hasSecondChance: false,
      });

      const drawnCard = makeCard({ type: "action", value: "second-chance" });
      const result = resolveCardDraw(hand, drawnCard);

      expect(result.hand.hasSecondChance).toBe(true);
      expect(result.hand.cards).toHaveLength(2);
      expect(result.actionRequired).toBeNull();
    });

    it("should return actionRequired if already has Second Chance", () => {
      const hand = makeHand({
        cards: [makeCard({ type: "number", value: 4 })],
        score: 4,
        hasSecondChance: true,
      });

      const drawnCard = makeCard({ type: "action", value: "second-chance" });
      const result = resolveCardDraw(hand, drawnCard);

      // Effect is deferred to modal
      expect(result.hand.hasSecondChance).toBe(true);
      expect(result.hand.cards).toHaveLength(2);
      expect(result.actionRequired).toEqual({ type: "second-chance-pass" });
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
      expect(result.hand.score).toBe(10);
      expect(result.hand.status).toBe("active");
    });
  });
});
