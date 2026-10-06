import React from "react";
import { motion } from "motion/react";
import robotImg from "../assets/images/ai_robot_avatar_1789401260338.jpg";

interface RobotAvatarProps {
  state: "idle" | "listening" | "processing" | "speaking";
  className?: string;
}

export default function RobotAvatar({ state, className = "" }: RobotAvatarProps) {
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isProcessing = state === "processing";

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Floating Robot Container */}
      <motion.div
        animate={{
          y: isListening ? [0, -12, 0] : isSpeaking ? [0, -8, 2, -6, 0] : [0, -10, 0],
        }}
        transition={{
          duration: isListening ? 2 : isSpeaking ? 1.5 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-64 md:h-64 flex items-center justify-center"
      >
        {/* Top-Left Sparkle Star ✦ */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.8, 1, 0.8],
            rotate: [0, 15, -15, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1 left-4 sm:left-6 z-20 pointer-events-none text-[#38bdf8]"
        >
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 fill-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]"
            viewBox="0 0 24 24"
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </motion.div>

        {/* Top-Right Sound Wave Arcs ))) */}
        <div className="absolute top-2 right-4 sm:right-6 z-20 flex items-center pointer-events-none">
          <motion.svg
            className="w-8 h-8 sm:w-10 sm:h-10 text-[#38bdf8]"
            viewBox="0 0 32 32"
            fill="none"
          >
            {/* Inner arc */}
            <motion.path
              d="M10 6C15 9 17 14 16 19"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{
                opacity: isListening || isSpeaking ? [0.4, 1, 0.4] : [0.5, 0.9, 0.5],
              }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            {/* Outer arc */}
            <motion.path
              d="M17 3C24 7 26 15 24 23"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{
                opacity: isListening || isSpeaking ? [0.2, 1, 0.2] : [0.3, 0.7, 0.3],
              }}
              transition={{ duration: 1.2, delay: 0.2, repeat: Infinity }}
            />
          </motion.svg>
        </div>

        {/* Main 3D Robot Character */}
        <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full flex items-center justify-center">
          {/* Ambient Glow Aura */}
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
              isListening
                ? "bg-blue-400/45 scale-110"
                : isSpeaking
                ? "bg-cyan-400/40 scale-105"
                : isProcessing
                ? "bg-purple-400/35 scale-105"
                : "bg-blue-400/25 scale-100"
            }`}
          />

          {/* Rendered 3D Robot Image */}
          <img
            src={robotImg}
            alt="AI Assistant Character"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain relative z-10 select-none pointer-events-none drop-shadow-[0_12px_24px_rgba(37,99,235,0.22)]"
          />

          {/* Interactive Dynamic Overlay Elements (Eye blink & state animations) */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            {/* Active speaking or listening audio ring pulse */}
            {(isListening || isSpeaking) && (
              <motion.div
                animate={{
                  scale: [1, 1.14, 1],
                  opacity: [0.6, 0.1, 0.6],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border-2 border-cyan-400/60 pointer-events-none"
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating Diffused Shadow Underneath */}
      <motion.div
        animate={{
          scale: isListening ? [1, 0.82, 1] : [1, 0.88, 1],
          opacity: isListening ? [0.65, 0.4, 0.65] : [0.55, 0.35, 0.55],
        }}
        transition={{
          duration: isListening ? 2 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-32 sm:w-44 h-5 rounded-full bg-gradient-to-r from-blue-300/40 via-blue-500/35 to-blue-300/40 blur-md mt-[-10px] pointer-events-none"
      />
    </div>
  );
}
