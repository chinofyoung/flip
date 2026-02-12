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
    } catch {
      toast.error("Failed to copy room code");
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted/40 uppercase tracking-[0.3em]">
              Room Code
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black font-mono text-gold tracking-widest italic leading-none">
                {code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 px-2 bg-gold/10 hover:bg-gold/20 rounded-lg transition-all border border-gold/20"
                aria-label="Copy room code"
              >
                <Copy className="w-3.5 h-3.5 text-gold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            {playerCount} {playerCount === 1 ? "Player" : "Players"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onEndRound && (
            <button
              type="button"
              onClick={onEndRound}
              className="group flex items-center gap-2 h-10 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-xl border border-red-500/20 shadow-lg transition-all active:scale-95"
            >
              <StopCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="hidden xs:inline">Abort Round</span>
            </button>
          )}

          {onLeave && (
            <button
              type="button"
              onClick={onLeave}
              className="flex items-center gap-2 h-10 px-4 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 rounded-xl border border-white/5 hover:border-red-500/20 transition-all shadow-lg active:scale-95"
              aria-label="Leave game"
              title="Leave game"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline font-black text-[10px] uppercase tracking-widest">Exit Game</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
