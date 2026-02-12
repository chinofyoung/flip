import type { PlayerHand, Card } from "@/lib/firestore-schema";
import { calculateScore, isBusted } from "./scoring";

/**
 * Represents an action that requires player interaction.
 * Currently only Flip Three requires target selection.
 */
export type ActionRequired = {
  type: "flip-three";
  sourcePlayerId?: string;
};

/**
 * Applies the Freeze action to a player's hand.
 * Freezes the player (like staying), banking their score for the round.
 *
 * @param hand - The current player hand
 * @returns A new hand with status set to "frozen"
 */
export function applyFreeze(hand: PlayerHand): PlayerHand {
  return {
    ...hand,
    status: "frozen",
  };
}

/**
 * Applies the Second Chance action to a player's hand.
 * Grants the player a shield against the next bust.
 * When triggered, the shield is consumed and the bust-causing card
 * is removed from the hand, allowing the player to continue.
 *
 * @param hand - The current player hand
 * @returns A new hand with hasSecondChance set to true
 */
export function applySecondChance(hand: PlayerHand): PlayerHand {
  return {
    ...hand,
    hasSecondChance: true,
  };
}

/**
 * Resolves drawing a card, handling all card types and their effects.
 * This is the main function for processing card draws in Flip 7.
 *
 * @param hand - The current player hand
 * @param drawnCard - The card being drawn
 * @returns An object containing the updated hand and any required action
 */
export function resolveCardDraw(
  hand: PlayerHand,
  drawnCard: Card
): { hand: PlayerHand; actionRequired: ActionRequired | null } {
  // Start with the card added to the hand
  let updatedHand: PlayerHand = {
    ...hand,
    cards: [...hand.cards, drawnCard],
  };

  let actionRequired: ActionRequired | null = null;

  // Handle based on card type
  const cardType = drawnCard.type;

  if (cardType === "number") {
    // Check for bust (duplicate number)
    const busted = isBusted(updatedHand.cards);

    if (busted) {
      if (updatedHand.hasSecondChance) {
        // Consume the Second Chance shield
        // Remove the duplicate card that caused the bust
        const cardsWithoutDuplicate = updatedHand.cards.filter(
          (card) => card.id !== drawnCard.id
        );

        updatedHand = {
          ...updatedHand,
          cards: cardsWithoutDuplicate,
          hasSecondChance: false,
        };
      } else {
        // Player is busted
        updatedHand = {
          ...updatedHand,
          status: "busted",
        };
      }
    }
  } else if (cardType === "action") {
    // Handle action cards based on their value
    const actionValue = drawnCard.value as string;

    if (actionValue === "freeze") {
      updatedHand = applyFreeze(updatedHand);
    } else if (actionValue === "second-chance") {
      updatedHand = applySecondChance(updatedHand);
    } else if (actionValue === "flip-three") {
      // Flip Three requires the player to select a target
      actionRequired = {
        type: "flip-three",
      };
    }
  }
  // Modifier cards are handled in scoring, not here

  // Recalculate the score
  updatedHand = {
    ...updatedHand,
    score: calculateScore(updatedHand.cards),
  };

  return {
    hand: updatedHand,
    actionRequired,
  };
}
