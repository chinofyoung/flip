"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Trash2,
    RefreshCcw,
    History,
    Trophy,
    Layout,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import {
    getAllRooms,
    deleteRoom,
    getAllGames,
    deleteGame,
    getAllUsers,
    deleteUserStats,
    checkIsAdmin
} from "@/lib/admin-service";
import type { Room, GameRecord, UserProfile } from "@/lib/firestore-schema";
import { toast } from "sonner";

type Tab = "rooms" | "games" | "leaderboard";

function AdminDashboardContent() {
    const router = useRouter();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>("rooms");
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [rooms, setRooms] = useState<Room[]>([]);
    const [games, setGames] = useState<GameRecord[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);

    useEffect(() => {
        const verifyAdmin = async () => {
            if (!user) return;
            try {
                const adminStatus = await checkIsAdmin(user.uid);
                setIsAdmin(adminStatus);
                if (adminStatus) {
                    fetchData(activeTab);
                }
            } catch (error) {
                console.error("Failed to verify admin status:", error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        verifyAdmin();
    }, [user, activeTab]);

    const fetchData = async (tab: Tab) => {
        setIsLoading(true);
        try {
            if (tab === "rooms") {
                const data = await getAllRooms(50);
                setRooms(data);
            } else if (tab === "games") {
                const data = await getAllGames(50);
                setGames(data);
            } else if (tab === "leaderboard") {
                const data = await getAllUsers(50);
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm("Are you sure you want to delete this room?")) return;
        try {
            await deleteRoom(roomId);
            setRooms((prev) => prev.filter((r) => r.id !== roomId));
            toast.success("Room deleted");
        } catch (error) {
            console.error("Failed to delete room:", error);
            toast.error("Failed to delete room");
        }
    };

    const handleDeleteGame = async (gameId: string) => {
        if (!confirm("Are you sure you want to delete this game record?")) return;
        try {
            await deleteGame(gameId);
            setGames((prev) => prev.filter((g) => g.id !== gameId));
            toast.success("Game record deleted");
        } catch (error) {
            console.error("Failed to delete game:", error);
            toast.error("Failed to delete game record");
        }
    };

    const handleDeleteUserStats = async (userId: string) => {
        if (!confirm("Are you sure you want to reset this user's stats? This cannot be undone.")) return;
        try {
            await deleteUserStats(userId);
            setUsers((prev) => prev.filter((u) => u.uid !== userId));
            toast.success("User stats reset");
        } catch (error) {
            console.error("Failed to delete user stats:", error);
            toast.error("Failed to reset user stats");
        }
    };

    if (isAdmin === null || isLoading && !rooms.length && !games.length && !users.length) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
                    <p className="text-muted text-sm mb-6">
                        You do not have permission to access the admin dashboard.
                    </p>
                    <button
                        onClick={() => router.push("/")}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-semibold transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-muted/10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/")}
                                className="p-2 hover:bg-surface rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-foreground" />
                            </button>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Layout className="w-5 h-5 text-gold" />
                                Admin Dashboard
                            </h1>
                        </div>
                        <button
                            onClick={() => fetchData(activeTab)}
                            className="p-2 hover:bg-surface rounded-lg transition-colors text-muted hover:text-foreground"
                            title="Refresh Data"
                        >
                            <RefreshCcw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2 p-1 bg-surface/50 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab("rooms")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "rooms"
                                ? "bg-gold text-background shadow-lg shadow-gold/20"
                                : "text-muted hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <Layout className="w-4 h-4" />
                            Rooms
                        </button>
                        <button
                            onClick={() => setActiveTab("games")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "games"
                                ? "bg-gold text-background shadow-lg shadow-gold/20"
                                : "text-muted hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <History className="w-4 h-4" />
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab("leaderboard")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "leaderboard"
                                ? "bg-gold text-background shadow-lg shadow-gold/20"
                                : "text-muted hover:text-foreground hover:bg-white/5"
                                }`}
                        >
                            <Trophy className="w-4 h-4" />
                            Leaderboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {activeTab === "rooms" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">
                            Active Rooms ({rooms.length})
                        </h2>
                        {rooms.length === 0 ? (
                            <div className="text-center py-12 text-muted italic">No active rooms found.</div>
                        ) : (
                            <div className="grid gap-3">
                                {rooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="bg-surface border border-muted/10 rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-lg font-mono font-bold text-gold">
                                                    {room.code}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${room.status === "playing"
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : room.status === "finished"
                                                        ? "bg-blue-500/10 text-blue-400"
                                                        : "bg-amber-500/10 text-amber-400"
                                                    }`}>
                                                    {room.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted">
                                                {room.players.length} Players • Round {room.currentRound}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteRoom(room.id)}
                                            className="p-2 hover:bg-red-500/10 text-muted hover:text-red-400 rounded-lg transition-colors"
                                            title="Delete Room"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "games" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">
                            Game History ({games.length})
                        </h2>
                        {games.length === 0 ? (
                            <div className="text-center py-12 text-muted italic">No game history found.</div>
                        ) : (
                            <div className="grid gap-3">
                                {games.map((game) => (
                                    <div
                                        key={game.id}
                                        className="bg-surface border border-muted/10 rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-foreground">
                                                    Room {game.roomCode}
                                                </span>
                                                <span className="text-xs text-muted">
                                                    • {new Date(game.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted">
                                                Winner: <span className="text-gold">{game.players.find(p => p.uid === game.winnerId)?.displayName || "Unknown"}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGame(game.id)}
                                            className="p-2 hover:bg-red-500/10 text-muted hover:text-red-400 rounded-lg transition-colors"
                                            title="Delete Game Record"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === "leaderboard" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <h2 className="text-sm font-bold text-muted uppercase tracking-wider mb-4">
                            User Stats ({users.length})
                        </h2>
                        {users.length === 0 ? (
                            <div className="text-center py-12 text-muted italic">No users found.</div>
                        ) : (
                            <div className="grid gap-3">
                                {users.map((profile) => (
                                    <div
                                        key={profile.uid}
                                        className="bg-surface border border-muted/10 rounded-xl p-4 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center overflow-hidden">
                                                {profile.photoURL ? (
                                                    <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-foreground">
                                                        {profile.displayName.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground">
                                                        {profile.displayName}
                                                    </span>
                                                    {profile.isAdmin && (
                                                        <span className="text-[10px] bg-gold/20 text-gold px-1.5 py-0.5 rounded uppercase font-bold">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted font-mono">
                                                    Wins: {profile.gamesWon} • Played: {profile.gamesPlayed}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUserStats(profile.uid)}
                                            className="p-2 hover:bg-red-500/10 text-muted hover:text-red-400 rounded-lg transition-colors"
                                            title="Reset User Stats"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <AuthGuard>
            <AdminDashboardContent />
        </AuthGuard>
    );
}
