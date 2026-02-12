"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Layout } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { createRoom } from "@/lib/room-service";
import { checkIsAdmin } from "@/lib/admin-service";

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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user) return;
      try {
        const adminStatus = await checkIsAdmin(user.uid);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error("Failed to verify admin status:", error);
      }
    };

    verifyAdmin();
  }, [user]);

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
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-8 relative z-10">
        <p className="text-muted text-sm">
          Welcome{user?.displayName ? `, ${user.displayName}` : ""}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="px-5 py-2 text-sm font-medium border border-muted/30 rounded-xl text-foreground hover:bg-surface transition-all active:scale-95"
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

          <div className="flex space-between gap-4">
            {/* Past Games */}
            <motion.button
              type="button"
              onClick={() => router.push("/history")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 text-muted font-medium hover:text-foreground transition-colors border border-muted/30 rounded-lg"
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
              className="w-full py-4 text-muted font-medium hover:text-foreground transition-colors border border-muted/30 rounded-lg"
            >
              🏆 Leaderboard
            </motion.button>
          </div>

          {/* Admin Dashboard */}
          {isAdmin && (
            <motion.button
              type="button"
              onClick={() => router.push("/rooms")}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 text-gold/80 font-medium hover:text-gold hover:bg-gold/10 transition-colors border border-gold/20 rounded-lg flex items-center justify-center gap-2"
            >
              <Layout className="w-4 h-4" />
              Admin Dashboard
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
