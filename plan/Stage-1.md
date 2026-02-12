# Stage 1 — Foundation & Auth

> **Goal:** Project scaffolding, Firebase wired up, users can sign in.

---

## 1.1 Dependencies

#### [MODIFY] [package.json](file:///Users/chinoyoung/Code/flip/package.json)
Install new dependencies:
- `firebase` — Auth + Firestore SDK
- `zustand` — lightweight client state management
- `framer-motion` — card animations and transitions
- `nanoid` — short room code generation
- `sonner` — toast notifications

---

## 1.2 Firebase Config

#### [NEW] [lib/firebase.ts](file:///Users/chinoyoung/Code/flip/lib/firebase.ts)
Initialize Firebase app, Auth, and Firestore instances from env vars.

#### [NEW] [.env.local](file:///Users/chinoyoung/Code/flip/.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDpC5RVHi7E3mE9tzq0Aw3v4LLQvEDP
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flip-79955.firebaseapp.com
NEXT_PUBLIC_DATABASE_URL=https://flip-79955-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=flip-79955
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flip-79955.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=561668566854
NEXT_PUBLIC_FIREBASE_APP_ID=1:561668566854:web:2866f3c46f9b2bd820ff47
```

---

## 1.3 Auth

#### [NEW] [lib/auth-context.tsx](file:///Users/chinoyoung/Code/flip/lib/auth-context.tsx)
React context providing `user`, `loading`, `signInWithGoogle()`, `signInAnonymously()`, `signOut()`. Wraps `onAuthStateChanged`.

#### [NEW] [app/login/page.tsx](file:///Users/chinoyoung/Code/flip/app/login/page.tsx)
Google sign-in + "Play as Guest" (anonymous). Flip 7 branding.

#### [NEW] [components/AuthGuard.tsx](file:///Users/chinoyoung/Code/flip/components/AuthGuard.tsx)
Redirects unauthenticated users to `/login`.

#### [MODIFY] [app/layout.tsx](file:///Users/chinoyoung/Code/flip/app/layout.tsx)
Wrap with `AuthProvider`, add Inter font, mobile viewport meta.

---

## ✅ Deliverable
- App boots, user can sign in with Google or as Guest
- Auth state persists across refreshes

## 🧪 Verification
- Open app → redirected to `/login`
- Sign in with Google → redirected to home
- Refresh → still signed in
- Sign out → back to `/login`
