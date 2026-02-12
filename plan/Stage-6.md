# Stage 6 — Polish & UI Refinement

> **Goal:** Premium look & feel, animations, edge-case handling.

---

## 6.1 Design Direction
- **Theme:** Dark mode, emerald green felt, gold/amber highlights
- **Typography:** Inter via Google Fonts
- **Cards:** Rounded, elevated, gradient backgrounds by type (blue = numbers, gold = modifiers, red = actions)
- **Animations:** Card flip anims, score counter transitions, confetti on Flip 7
- **Mobile-first:** Bottom-sheet card picker, large tap targets, swipe gestures

---

## 6.2 Polish Tasks
- Loading / skeleton states for all async views
- Error handling & toast notifications (sonner)
- Responsive fine-tuning (small screens, safe areas)
- PWA considerations (add to home screen, offline fallback)
- Haptic feedback on card selection (vibration API)
- Sound effects (optional toggle)

---

## ✅ Deliverable
- Polished, premium mobile experience
- Smooth animations and transitions
- Robust error handling

## 🧪 Verification
- `npm run build` passes with no errors
- Smooth animations across card selection, scoring, round transitions
- No visual regressions on various screen sizes
- Error states display correctly (network loss, invalid room code, etc.)
