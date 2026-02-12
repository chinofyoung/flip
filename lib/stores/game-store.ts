import { create } from "zustand";
import type { Room, Round } from "@/lib/firestore-schema";

export type GamePhase = "lobby" | "playing" | "round-end" | "game-over";

export type ActionModalType =
    | { type: "flip-three"; sourcePlayerId: string }
    | { type: "freeze"; sourcePlayerId: string }
    | { type: "second-chance-pass"; sourcePlayerId: string }
    | null;

interface GameState {
    // Room state
    room: Room | null;
    round: Round | null;
    gamePhase: GamePhase;

    // Scores
    cumulativeScores: Record<string, number>;
    roundScores: Record<string, number>;

    // Action modal
    actionModal: ActionModalType;

    // Actions
    setRoom: (room: Room | null) => void;
    setRound: (round: Round | null) => void;
    setGamePhase: (phase: GamePhase) => void;
    setCumulativeScores: (scores: Record<string, number>) => void;
    setRoundScores: (scores: Record<string, number>) => void;
    showActionModal: (modal: ActionModalType) => void;
    hideActionModal: () => void;
    reset: () => void;
}

const initialState = {
    room: null,
    round: null,
    gamePhase: "lobby" as GamePhase,
    cumulativeScores: {},
    roundScores: {},
    actionModal: null as ActionModalType,
};

export const useGameStore = create<GameState>((set) => ({
    ...initialState,

    setRoom: (room) =>
        set((state) => {
            // Auto-detect game phase from room status
            let gamePhase = state.gamePhase;
            if (room?.status === "waiting") gamePhase = "lobby";
            else if (room?.status === "finished") gamePhase = "game-over";
            else if (room?.status === "playing" && state.gamePhase === "lobby")
                gamePhase = "playing";

            return { room, gamePhase };
        }),

    setRound: (round) => set({ round }),
    setGamePhase: (gamePhase) => set({ gamePhase }),
    setCumulativeScores: (cumulativeScores) => set({ cumulativeScores }),
    setRoundScores: (roundScores) => set({ roundScores }),
    showActionModal: (actionModal) => set({ actionModal }),
    hideActionModal: () => set({ actionModal: null }),
    reset: () => set(initialState),
}));
