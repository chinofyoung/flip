# Flip 7 — Real-Time Scoring Companion App

A mobile-first web app that lets players score their physical Flip 7 card game in real-time. Players create/join rooms, select drawn cards on their phone, and the app auto-computes scores, handles action cards, and saves game history.

**Tech stack:** Next.js 16 · Tailwind CSS 4 · Firebase Auth · Cloud Firestore · Zustand

---

## Implementation Stages

| Stage | File | Focus | Key Deliverable |
|---|---|---|---|
| 1 | [Stage-1.md](file:///Users/chinoyoung/Code/flip/plan/Stage-1.md) | Foundation & Auth | Firebase + Google/Guest sign-in |
| 2 | [Stage-2.md](file:///Users/chinoyoung/Code/flip/plan/Stage-2.md) | Core Game Logic | Scoring engine, bust detection, action cards |
| 3 | [Stage-3.md](file:///Users/chinoyoung/Code/flip/plan/Stage-3.md) | Room System | Create/join rooms, real-time lobby |
| 4 | [Stage-4.md](file:///Users/chinoyoung/Code/flip/plan/Stage-4.md) | Game Play UI | Card picker, scoring, round flow, action modals |
| 5 | [Stage-5.md](file:///Users/chinoyoung/Code/flip/plan/Stage-5.md) | History & Leaderboard | Past games, all-time stats |
| 6 | [Stage-6.md](file:///Users/chinoyoung/Code/flip/plan/Stage-6.md) | Polish & Refinement | Animations, error handling, premium feel |

---

## Important Notes

> [!IMPORTANT]
> **Firebase Project Setup** — Enable these in your Firebase console:
> 1. **Authentication** → Google sign-in provider + Anonymous sign-in
> 2. **Cloud Firestore** → Create database (start in test mode)

> [!IMPORTANT]
> **Card Deck Verification** — The 94-card distribution is based on research. Verify against your physical deck.

> [!NOTE]
> **Turn Enforcement** — The app trusts player input (they select cards they actually drew). It focuses on score computation + real-time sync, not deck management.

---

## Verification Summary

| Stage | Verification |
|---|---|
| 1 | Sign in with Google / Guest → auth state persists |
| 2 | Unit tests pass for scoring, bust detection, Flip 7 bonus |
| 3 | Create room on device A → join on device B → both see lobby in real-time |
| 4 | Play a full multi-round game → scores sync → action cards work → game ends at 200 pts |
| 5 | Completed game appears in history → leaderboard reflects stats |
| 6 | `npm run build` passes → smooth animations → no visual regressions |
