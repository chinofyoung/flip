"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle, signInAnonymously } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
      setIsSigningIn(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInAnonymously();
    } catch (error) {
      console.error("Guest sign-in error:", error);
      toast.error("Failed to sign in as guest. Please try again.");
      setIsSigningIn(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-gold/5 blur-[100px] pointer-events-none" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[380px]"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-14"
        >
          <div className="flex items-baseline justify-center gap-1 mb-3">
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              FLIP
            </h1>
            <motion.span
              className="text-7xl font-bold text-gold"
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              7
            </motion.span>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted">
            Score Companion
          </p>
        </motion.div>

        {/* Sign-in buttons */}
        <div className="space-y-3">
          {/* Google Sign In */}
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || loading}
            className="w-full h-14 bg-gold hover:bg-gold/90 text-background font-semibold rounded-xl transition-colors flex items-center justify-center gap-3 card-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-label="Google"
            >
              <path
                d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z"
                fill="#4285F4"
              />
              <path
                d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z"
                fill="#34A853"
              />
              <path
                d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z"
                fill="#FBBC04"
              />
              <path
                d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z"
                fill="#EA4335"
              />
            </svg>
            {isSigningIn ? "Signing in..." : "Sign in with Google"}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-1">
            <div className="flex-1 h-px bg-muted/20" />
            <span className="text-xs text-muted/60 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-muted/20" />
          </div>

          {/* Guest Sign In */}
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGuestSignIn}
            disabled={isSigningIn || loading}
            className="w-full h-14 bg-transparent border-2 border-emerald/40 hover:border-emerald/60 text-foreground font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald/5"
          >
            {isSigningIn ? "Signing in..." : "Play as Guest"}
          </motion.button>
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center text-xs text-muted/60 mt-8"
        >
          No account needed to play as guest
        </motion.p>
      </motion.div>
    </div>
  );
}
