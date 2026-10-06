import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface SpeechBubbleProps {
  title?: string;
  message?: string;
  isProcessing?: boolean;
  className?: string;
}

export default function SpeechBubble({
  title = "Hello!",
  message = "How can I help you today?",
  isProcessing = false,
  className = "",
}: SpeechBubbleProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Speech Bubble Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-[#eaf3fe] border-2 border-[#bfe0ff] rounded-3xl p-6 sm:p-7 md:p-8 shadow-[0_8px_24px_rgba(191,224,255,0.28)] max-w-lg min-w-[220px] sm:min-w-[280px]"
      >
        {/* Left-pointing Speech Bubble Pointer Tail */}
        <div className="absolute top-1/2 -left-[14px] -translate-y-1/2 w-4 h-6 overflow-hidden pointer-events-none">
          {/* Custom SVG tail matching border & fill */}
          <svg
            className="w-4 h-6 -scale-x-100"
            viewBox="0 0 16 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 24C10 21 0 14 0 12C0 10 10 3 16 0V24Z"
              fill="#eaf3fe"
              stroke="#bfe0ff"
              strokeWidth="2.5"
            />
            {/* White cover to erase inner border */}
            <rect x="13" y="0" width="4" height="24" fill="#eaf3fe" />
          </svg>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1.5 z-10 relative">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                    Thinking
                  </span>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  </div>
                </div>
                <p className="text-sm sm:text-base text-slate-500 font-medium">
                  Processing your request...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={title + message}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {title && (
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                    {title}
                  </h2>
                )}
                {message && (
                  <p className="text-base sm:text-lg md:text-xl text-slate-700 font-medium leading-snug mt-1 max-h-48 overflow-y-auto pr-1 scrollbar-hide">
                    {message}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
