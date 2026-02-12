"use client";

import { toast } from "sonner";
import { Copy, StopCircle, LogOut } from "lucide-react";

interface RoomHeaderProps {
  code: string;
  playerCount: number;
  onEndRound?: () => void;
  onLeave?: () => void;
}

export default function RoomHeader({
  code,
  playerCount,
  onEndRound,
  onLeave
}: RoomHeaderProps) {
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

      <div className="flex items-center gap-4">
        <div className="hidden sm:block px-4 py-2 bg-emerald/10 border border-emerald/20 rounded-full">
          <span className="text-sm font-medium text-emerald">
            {playerCount} {playerCount === 1 ? "player" : "players"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onEndRound && (
            <button
              type="button"
              onClick={onEndRound}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-all flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              <span className="hidden xs:inline">End Round</span>
            </button>
          )}

          {onLeave && (
            <button
              type="button"
              onClick={onLeave}
              className="p-2 bg-muted/10 hover:bg-muted/20 text-muted hover:text-foreground rounded-lg border border-muted/20 transition-all"
              aria-label="Leave game"
              title="Leave game"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
