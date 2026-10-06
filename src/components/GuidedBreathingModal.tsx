import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wind, Heart, Sparkles } from "lucide-react";

interface GuidedBreathingModalProps {
  onClose: () => void;
}

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

export default function GuidedBreathingModal({ onClose }: GuidedBreathingModalProps) {
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [counter, setCounter] = useState(4);
  const [cycle, setCycle] = useState(1);
  const totalCycles = 4;

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phase
        if (phase === "inhale") {
          setPhase("hold");
          return 4;
        } else if (phase === "hold") {
          setPhase("exhale");
          return 4;
        } else if (phase === "exhale") {
          setPhase("rest");
          return 4;
        } else {
          setCycle((c) => Math.min(totalCycles, c + 1));
          setPhase("inhale");
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return { title: "Breathe In Slowly", sub: "Deep breath through your nose...", color: "text-emerald-300" };
      case "hold":
        return { title: "Hold Gently", sub: "Feel the calm fill your body...", color: "text-cyan-300" };
      case "exhale":
        return { title: "Breathe Out Peacefully", sub: "Release all tension and stress...", color: "text-teal-300" };
      case "rest":
        return { title: "Rest & Be Still", sub: "You are safe and cared for...", color: "text-amber-200" };
    }
  };

  const currentInfo = getPhaseText();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-gradient-to-b from-neutral-900 to-neutral-950 border border-emerald-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-white flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2 text-emerald-400">
          <Wind className="w-5 h-5" />
          <span className="text-xs uppercase font-mono tracking-widest">Mindful Respiration</span>
        </div>
        <h3 className="text-xl font-medium tracking-wide">Zoya's Calming Breath</h3>
        <p className="text-xs text-neutral-400 mt-1 mb-8">Cycle {cycle} of {totalCycles} • Box Breathing</p>

        {/* Animated Breathing Orb */}
        <div className="relative w-64 h-64 flex items-center justify-center my-4">
          {/* Ambient Outer Rings */}
          <motion.div
            animate={{
              scale: phase === "inhale" ? [1, 1.3] : phase === "hold" ? 1.3 : phase === "exhale" ? [1.3, 1] : 1,
              opacity: phase === "inhale" ? [0.2, 0.5] : phase === "hold" ? 0.5 : phase === "exhale" ? [0.5, 0.2] : 0.2,
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl"
          />

          <motion.div
            animate={{
              scale: phase === "inhale" ? [0.9, 1.25] : phase === "hold" ? 1.25 : phase === "exhale" ? [1.25, 0.9] : 0.9,
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
            className="w-48 h-48 rounded-full border border-emerald-400/40 flex items-center justify-center relative shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          >
            {/* Center Core */}
            <motion.div
              animate={{
                scale: phase === "inhale" ? [0.8, 1.15] : phase === "hold" ? 1.15 : phase === "exhale" ? [1.15, 0.8] : 0.8,
                backgroundColor: phase === "inhale" || phase === "hold" ? "rgba(16, 185, 129, 0.3)" : "rgba(13, 148, 136, 0.2)",
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center backdrop-blur-md border border-emerald-300/50 shadow-inner"
            >
              <span className="text-4xl font-mono font-bold text-white tracking-wider">{counter}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-200/80 mt-0.5">seconds</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Phase Guidance */}
        <div className="text-center mt-6 h-16 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >
              <h4 className={`text-lg font-semibold ${currentInfo.color}`}>{currentInfo.title}</h4>
              <p className="text-xs text-neutral-300 mt-0.5">{currentInfo.sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="w-full mt-4 flex items-center justify-between border-t border-neutral-800 pt-4">
          <span className="text-xs text-neutral-400 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Relax your shoulders & jaw</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
