"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface PlayerAvatarProps {
    photoURL: string | null;
    displayName: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    borderColor?: string;
}

export default function PlayerAvatar({
    photoURL,
    displayName,
    size = "md",
    className,
    borderColor,
}: PlayerAvatarProps) {
    const sizeClasses = {
        sm: "w-6 h-6 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-24 h-24 text-3xl",
    };

    const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

    return (
        <div
            className={cn(
                "relative rounded-full flex items-center justify-center overflow-hidden bg-surface border border-white/10 shadow-sm",
                sizeClasses[size],
                className
            )}
            style={borderColor ? { borderColor } : undefined}
        >
            {photoURL ? (
                <Image
                    src={photoURL}
                    alt={displayName}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                />
            ) : (
                <span className="font-bold text-muted-foreground">{initial}</span>
            )}
        </div>
    );
}
