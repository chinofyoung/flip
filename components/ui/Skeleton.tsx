"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
    return <div className={`skeleton ${className}`} />;
}

/** Full-page loading skeleton for game views */
export function GameSkeleton() {
    return (
        <div className="min-h-dvh bg-background p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="w-28 h-6" />
                <Skeleton className="w-16 h-6" />
            </div>

            {/* Scoreboard skeleton */}
            <div className="space-y-2">
                <Skeleton className="w-20 h-3" />
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="w-full h-14" />
                ))}
            </div>

            {/* Hand skeleton */}
            <div className="mt-6 space-y-3">
                <Skeleton className="w-16 h-3" />
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="w-12 h-16 rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Card picker skeleton */}
            <div className="mt-6 space-y-3">
                <Skeleton className="w-24 h-3" />
                <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 14 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}

/** List loading skeleton (for history/leaderboard) */
export function ListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <Skeleton className="w-full h-20" />
                </motion.div>
            ))}
        </div>
    );
}
