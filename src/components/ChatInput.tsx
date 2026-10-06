import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSendMessage,
  isListening,
  onToggleListening,
  disabled = false,
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full relative">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-2xl md:rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_2px_14px_rgba(0,0,0,0.03)] px-5 py-3 md:py-3.5 flex items-center justify-between gap-3 transition-all focus-within:border-blue-400 focus-within:shadow-[0_4px_20px_rgba(37,99,235,0.12)]"
      >
        {/* Text Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening to your voice..." : "Type your message..."}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-sans text-base md:text-lg font-normal tracking-normal disabled:opacity-50"
        />

        {/* Action Button: If text is typed, show Send, otherwise show blue round Mic button */}
        <div className="flex items-center gap-2 shrink-0">
          {inputValue.trim().length > 0 ? (
            <motion.button
              type="submit"
              whileTap={{ scale: 0.93 }}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(37,99,235,0.35)] transition-all cursor-pointer"
              title="Send Message"
            >
              <Send className="w-5 h-5 md:w-6 md:h-6 -translate-x-0.5" />
            </motion.button>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Pulsing listening waves when active */}
              {isListening && (
                <>
                  <span className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping pointer-events-none" />
                  <span className="absolute -inset-1 rounded-full bg-blue-500/30 animate-pulse pointer-events-none" />
                </>
              )}

              <button
                type="button"
                onClick={onToggleListening}
                disabled={disabled}
                className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.35)] transition-all cursor-pointer active:scale-95 ${
                  isListening
                    ? "bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-200"
                    : "bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                }`}
                title={isListening ? "Stop listening" : "Click to speak"}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 md:w-7 md:h-7 text-white" />
                )}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
