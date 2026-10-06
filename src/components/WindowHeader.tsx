import React from "react";
import { Minus, Square, X, RefreshCw } from "lucide-react";

interface WindowHeaderProps {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isFullscreen?: boolean;
}

export default function WindowHeader({
  onMinimize,
  onMaximize,
  onClose,
  isFullscreen = false,
}: WindowHeaderProps) {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 select-none shrink-0">
      {/* Brand: Planet Logo + AI Assistant */}
      <div className="flex items-center gap-3">
        {/* Glowing Planet Orb with Saturn-like Ring */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Main sphere with vibrant gradient */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#38bdf8] shadow-[0_2px_10px_rgba(37,99,235,0.4)] flex items-center justify-center relative overflow-hidden">
            {/* Gloss highlight */}
            <div className="absolute top-1 left-1.5 w-3 h-1.5 bg-white/60 rounded-full blur-[0.5px] -rotate-12" />
          </div>

          {/* Planetary cyan orbit ring */}
          <svg
            className="absolute inset-0 w-9 h-9 pointer-events-none -rotate-25 scale-110"
            viewBox="0 0 36 36"
            fill="none"
          >
            <ellipse
              cx="18"
              cy="18"
              rx="15"
              ry="5.5"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              className="drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold tracking-tight text-slate-800 font-sans">
          AI Assistant
        </h1>
      </div>

      {/* Desktop Window Actions: Minimize, Maximize, Close */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMinimize}
          type="button"
          title="Minimize"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 active:scale-95 transition-all"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          onClick={onMaximize}
          type="button"
          title={isFullscreen ? "Restore Window" : "Maximize Window"}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 active:scale-95 transition-all"
        >
          <Square className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <button
          onClick={onClose}
          type="button"
          title="Close / Reset"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 active:scale-95 transition-all"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
}
