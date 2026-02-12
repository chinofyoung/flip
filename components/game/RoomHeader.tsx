"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";

interface RoomHeaderProps {
  code: string;
  playerCount: number;
}

export default function RoomHeader({ code, playerCount }: RoomHeaderProps) {
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Room code copied!");
    } catch (error) {
      toast.error("Failed to copy room code");
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-muted/20">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-mono font-bold text-gold tracking-wider">
            {code}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-2 hover:bg-background/50 rounded-lg transition-colors"
            aria-label="Copy room code"
          >
            <Copy className="w-5 h-5 text-gold" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 bg-emerald/10 border border-emerald/20 rounded-full">
        <span className="text-sm font-medium text-emerald">
          {playerCount} {playerCount === 1 ? "player" : "players"}
        </span>
      </div>
    </div>
  );
}
