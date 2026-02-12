# Dev server
Never start a dev server yourself; the user should start a dev server if needed.

# Test your changes
After completing a change or a feature, always kick off one to three code-reviewer agents to ensure that the code is of high quality.

# Development
Whenever possible, try not to implement the changes yourself. Depending on the complexity of the change, kick off several coding-agents to run in the background and, if possible, in parallel

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flip 7 — a mobile-first real-time scoring companion web app for the physical Flip 7 card game. Players create/join rooms, select drawn cards on their phone, and the app auto-computes scores, handles action cards, and syncs game state across players via Firestore.

**Tech stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript · Firebase Auth · Cloud Firestore · Zustand · Framer Motion

## Commands

- `npm run dev` — start dev server (localhost:3000)
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm start` — serve production build

## Architecture

**App Router** — all pages live under `app/` using Next.js file-based routing:
- `app/page.tsx` — home (create/join room)
- `app/login/page.tsx` — Google + guest sign-in
- `app/room/[code]/page.tsx` — lobby and game play (phases: lobby → playing → round-end → game-over)
- `app/history/page.tsx` and `app/history/[id]/page.tsx` — past games
- `app/leaderboard/page.tsx` — all-time stats

**Game logic** (`lib/game/`) — pure, testable functions:
- `deck.ts` — 94-card deck definition (numbers, modifiers, actions)
- `scoring.ts` — `calculateScore()`, `isBusted()`, `hasFlipSeven()`
- `actions.ts` — Freeze, Flip Three, Second Chance logic

**Services** (`lib/`):
- `firebase.ts` — Firebase app/auth/firestore init from `NEXT_PUBLIC_FIREBASE_*` env vars
- `auth-context.tsx` — React context for auth state, sign-in methods
- `room-service.ts` — Firestore room CRUD + real-time subscriptions
- `game-service.ts` — in-game operations (add card, stay, end round)

**State** (`lib/stores/`):
- `game-store.ts` — Zustand store synced with Firestore snapshots

**Components** (`components/game/`):
- `CardPicker`, `PlayerHand`, `ScoreBoard`, `ActionCardModal`, `RoundSummary`, `GameOverScreen`, `RoomHeader`

## Key Conventions

- Path alias: `@/*` maps to project root
- Styling: Tailwind CSS 4 via `@tailwindcss/postcss` plugin — use `@import "tailwindcss"` (not `@tailwind` directives)
- Fonts: Geist Sans + Geist Mono via `next/font/google`, exposed as CSS variables `--font-geist-sans` / `--font-geist-mono`
- Design: dark mode default, emerald green felt theme, gold/amber highlights. Cards use color-coded gradients (blue=numbers, gold=modifiers, red=actions)
- Mobile-first: bottom-sheet patterns, large tap targets
- ESLint: `eslint-config-next` with core-web-vitals + typescript presets
- Firebase config lives in `.env.local` (not committed)

## Game Rules Reference

- 94-card deck: numbers 0–12 (count = face value, except 0×3), modifiers (+2×3, +4×2, +10×1, x2×3), actions (Freeze×3, Flip Three×3, Second Chance×3)
- Bust = drawing a duplicate number card
- Flip 7 bonus = 7 unique number cards → +15 points
- Scoring: sum numbers → apply x2 multipliers → add bonus modifiers
- Game ends when any player reaches 200+ cumulative points

## Implementation Plan

Staged implementation is documented in `plan/` directory (Stage-1 through Stage-6). Check `plan/Implementation.md` for overview and current progress.
