"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { createRoom } from "@/lib/room-service";

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

function HomeContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCode, setRoomCode] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const handleCreateRoom = async () => {
    if (!user) return;

    setIsCreatingRoom(true);
    try {
      const room = await createRoom(
        user.uid,
        user.displayName || "Player",
        user.photoURL ?? null
      );
      router.push(`/room/${room.code}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error("Failed to create room. Please try again.");
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();

    if (code.length !== 6) {
      toast.error("Room code must be exactly 6 characters");
      return;
    }

    router.push(`/room/${code}`);
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setRoomCode(value);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-emerald/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-gold/3 blur-[100px] pointer-events-none" />
      {/* Top bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-8">
        <p className="text-muted text-sm">
          Welcome{user?.displayName ? `, ${user.displayName}` : ""}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="px-4 py-1.5 text-xs border border-muted/30 rounded-lg text-foreground hover:bg-surface transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-baseline justify-center gap-1 mb-12"
        >
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            FLIP
          </h1>
          <motion.span
            className="text-7xl font-bold text-gold"
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          >
            7
          </motion.span>
        </motion.div>

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-3">
          {/* Create Room */}
          <motion.button
            type="button"
            onClick={handleCreateRoom}
            disabled={isCreatingRoom}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gold text-background font-semibold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed card-elevated"
          >
            {isCreatingRoom ? "Creating..." : "Create Room"}
          </motion.button>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="space-y-3"
          >
            <motion.button
              type="button"
              onClick={() => setShowJoinInput(!showJoinInput)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 border-2 border-emerald text-emerald font-semibold rounded-lg hover:bg-emerald/10 transition-colors"
            >
              Join Room
            </motion.button>

            <AnimatePresence>
              {showJoinInput && (
                <motion.form
                  onSubmit={handleJoinRoom}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-surface rounded-lg p-4 space-y-3">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={handleRoomCodeChange}
                      placeholder="Enter room code"
                      className="w-full px-4 py-3 bg-background border border-muted/30 rounded-lg text-foreground placeholder:text-muted/50 focus:outline-none focus:border-emerald transition-colors uppercase tracking-wider text-center font-mono text-lg"
                      autoFocus
                      maxLength={6}
                    />
                    <button
                      type="submit"
                      disabled={roomCode.length !== 6}
                      className="w-full py-3 bg-emerald text-background font-semibold rounded-lg hover:bg-emerald/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Join
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Past Games */}
          <motion.button
            type="button"
            onClick={() => router.push("/history")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 text-muted font-medium hover:text-foreground transition-colors"
          >
            Past Games
          </motion.button>

          {/* Leaderboard */}
          <motion.button
            type="button"
            onClick={() => router.push("/leaderboard")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 text-muted font-medium hover:text-foreground transition-colors"
          >
            🏆 Leaderboard
          </motion.button>
        </div>
      </div>
    </div>
  );
}
