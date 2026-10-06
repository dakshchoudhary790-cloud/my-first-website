import { motion } from "motion/react";
import { AppMode } from "../types/caretaker";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
  mode?: AppMode;
}

export default function Visualizer({ state, mode = "companion" }: VisualizerProps) {
  const isCaretaker = mode === "caretaker";

  const getRingAnimation = (index: number, reverse: boolean = false) => {
    const baseSpeed =
      state === "listening" ? 3 : state === "processing" ? 1.5 : state === "speaking" ? 2 : 15;
    return {
      rotate: reverse ? [-360, 0] : [0, 360],
      transition: { duration: baseSpeed + index * 2, repeat: Infinity, ease: "linear" },
    };
  };

  const getPulseAnimation = () => {
    if (state === "speaking") {
      return {
        scale: [1, 1.05, 0.98, 1.02, 1],
        opacity: [0.8, 1, 0.8, 1, 0.8],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
      };
    }
    if (state === "listening") {
      return {
        scale: [1, 1.02, 1],
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" },
      };
    }
    if (state === "processing") {
      return {
        scale: [0.98, 1.02, 0.98],
        opacity: [0.6, 0.9, 0.6],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear" },
      };
    }
    return {
      scale: [1, 1.01, 1],
      opacity: [0.4, 0.6, 0.4],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    };
  };

  // Color palettes tailored by mode
  const getTheme = () => {
    if (isCaretaker) {
      // Calming healing emerald / teal / mint & warm rose
      switch (state) {
        case "listening":
          return {
            color: "rgba(16, 185, 129, 1)",
            glow: "shadow-emerald-500/60",
            border: "border-emerald-400",
          };
        case "processing":
          return {
            color: "rgba(20, 184, 166, 1)",
            glow: "shadow-teal-400/80",
            border: "border-teal-400",
          };
        case "speaking":
          return {
            color: "rgba(244, 63, 94, 1)", // Warm heartbeat rose
            glow: "shadow-rose-500/80",
            border: "border-rose-400",
          };
        default:
          return {
            color: "rgba(13, 148, 136, 0.8)",
            glow: "shadow-teal-500/40",
            border: "border-teal-500/50",
          };
      }
    }

    // Companion Mode: JARVIS Cyan / Violet / Pink
    switch (state) {
      case "listening":
        return {
          color: "rgba(139, 92, 246, 1)",
          glow: "shadow-violet-500/60",
          border: "border-violet-400",
        };
      case "processing":
        return {
          color: "rgba(56, 189, 248, 1)",
          glow: "shadow-sky-400/80",
          border: "border-sky-400",
        };
      case "speaking":
        return {
          color: "rgba(236, 72, 153, 1)",
          glow: "shadow-pink-500/80",
          border: "border-pink-400",
        };
      default:
        return {
          color: "rgba(6, 182, 212, 0.8)",
          glow: "shadow-cyan-500/40",
          border: "border-cyan-500/50",
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Ambient Glow */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[60%] h-[60%] rounded-full blur-[80px] ${theme.glow}`}
        style={{ backgroundColor: theme.color, opacity: 0.15 }}
      />

      {/* Ring 1: Massive Outer Dashed */}
      <motion.div
        animate={getRingAnimation(4, false)}
        className={`absolute w-[100%] h-[100%] rounded-full border-[1px] border-dashed ${theme.border} opacity-20`}
      />

      {/* Ring 2: Segmented Thick Ring */}
      <motion.div
        animate={getRingAnimation(3, true)}
        className={`absolute w-[85%] h-[85%] rounded-full border-[2px] border-dotted ${theme.border} opacity-30`}
      />

      {/* Ring 3: Scanner Ring (Solid with gaps) */}
      <motion.div
        animate={getRingAnimation(2, false)}
        className={`absolute w-[70%] h-[70%] rounded-full border-[1px] ${theme.border} border-t-transparent border-b-transparent opacity-40`}
      />

      {/* Ring 4: Inner Dashed */}
      <motion.div
        animate={getRingAnimation(1, true)}
        className={`absolute w-[55%] h-[55%] rounded-full border-[2px] border-dashed ${theme.border} opacity-50`}
      />

      {/* Ring 5: Core HUD Ring */}
      <motion.div
        animate={getRingAnimation(0, false)}
        className={`absolute w-[40%] h-[40%] rounded-full border-[4px] border-dotted ${theme.border} opacity-70`}
      />

      {/* Core Circle */}
      <motion.div
        animate={getPulseAnimation()}
        className={`absolute w-[26%] h-[26%] rounded-full border-[1px] ${theme.border} bg-black/50 backdrop-blur-md flex flex-col items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]`}
        style={{ boxShadow: `0 0 40px ${theme.color}, inset 0 0 30px ${theme.color}` }}
      >
        {/* Center Text */}
        <div
          className="font-bold tracking-[0.25em] text-xl md:text-3xl lg:text-4xl text-white font-mono"
          style={{ textShadow: `0 0 15px ${theme.color}, 0 0 30px ${theme.color}` }}
        >
          ZOYA
        </div>
        {isCaretaker && (
          <span
            className="text-[9px] md:text-[11px] tracking-[0.25em] font-mono text-emerald-300 font-bold uppercase mt-1 opacity-90"
            style={{ textShadow: `0 0 8px ${theme.color}` }}
          >
            CARETAKER
          </span>
        )}
      </motion.div>
    </div>
  );
}
