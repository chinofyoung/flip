# Optimization Stage 4 — Bundle & Rendering Performance

> **Goal:** Reduce initial bundle size, optimize rendering during gameplay, and leverage Next.js features for faster loads.

---

## 4.1 Next.js Configuration

#### [MODIFY] [next.config.ts](file:///Users/chinoyoung/Code/flip/next.config.ts)

Enable optimizations that are currently missing:

```ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};
```

---

## 4.2 Dynamic Imports for Game Components

#### [MODIFY] [app/room/[code]/page.tsx](file:///Users/chinoyoung/Code/flip/app/room/%5Bcode%5D/page.tsx)

Use `next/dynamic` for components that are only needed in specific game phases:

```tsx
const GameOverScreen = dynamic(
  () => import("@/components/game/GameOverScreen"),
  { ssr: false }
);
const RoundSummary = dynamic(
  () => import("@/components/game/RoundSummary"),
  { ssr: false }
);
const CardPicker = dynamic(
  () => import("@/components/game/CardPicker"),
  { ssr: false }
);
```

This keeps the lobby phase lightweight and loads game components on demand.

---

## 4.3 Use `next/image` for Avatars

#### [MODIFY] Files with `<img>` avatar tags:

Replace raw `<img src={photoURL}>` with Next.js `<Image>` for automatic:
- WebP/AVIF conversion
- Responsive sizing
- Lazy loading
- CDN caching

| File | Occurrences |
|---|---|
| `app/room/[code]/page.tsx` | 2 (lobby + playing) |
| `app/leaderboard/page.tsx` | 3 (podium places) |
| `app/history/[id]/page.tsx` | 1 (standings) |
| `components/game/ScoreBoard.tsx` | 1 |
| `components/game/GameOverScreen.tsx` | 1 |

> [!NOTE]
> If using the `PlayerAvatar` component from Stage 2, this change only needs to happen in that one component.

---

## 4.4 Memoize Derived State

#### [MODIFY] [app/room/[code]/page.tsx](file:///Users/chinoyoung/Code/flip/app/room/%5Bcode%5D/page.tsx)

Wrap frequently recomputed values with `useMemo`:

```tsx
const isUserInRoom = useMemo(
  () => room?.players.some((p) => p.uid === user?.uid) ?? false,
  [room?.players, user?.uid]
);

const isHost = useMemo(
  () => room?.hostId === user?.uid,
  [room?.hostId, user?.uid]
);

const myHand = useMemo(
  () => round?.playerHands[user?.uid || ""],
  [round?.playerHands, user?.uid]
);
```

This prevents unnecessary child re-renders during rapid Firestore updates.

---

## ✅ Deliverable
- Lobby loads faster with code-split game components
- Avatar images optimized and lazy-loaded automatically
- `lucide-react` and `framer-motion` tree-shaken properly
- Derived state only recalculated when dependencies change

## 🧪 Verification
- Build the app: `npm run build` → check bundle sizes in output
- Load lobby page → network tab shows game components NOT loaded
- Start a game → game components lazy-loaded on demand
- Avatars render as optimized `<Image>` with correct dimensions
- Existing tests pass: `npm run test`
