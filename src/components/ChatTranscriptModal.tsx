import React from "react";
import { X, Type, Trash2, Bot, User, HeartHandshake } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
}

interface ChatTranscriptModalProps {
  messages: ChatMessage[];
  largeFont: boolean;
  onToggleLargeFont: () => void;
  onClear: () => void;
  onClose: () => void;
  onQuickPrompt: (prompt: string) => void;
  isCaretakerMode: boolean;
}

export default function ChatTranscriptModal({
  messages,
  largeFont,
  onToggleLargeFont,
  onClear,
  onClose,
  onQuickPrompt,
  isCaretakerMode,
}: ChatTranscriptModalProps) {
  const caretakerQuickPrompts = [
    "Zoya, look at me and read my personality",
    "What is my vibe and aura right now?",
    "Maine apni dawai le li",
    "Ek glass paani note kar lo",
    "Aaj meri kounsi dawai bachi hai?",
    "Thoda breathing exercise karwa do",
    "Google search blood pressure normal range",
    "Play soothing flute bhajan on YouTube",
    "Doctor ka number kya hai?",
  ];

  const companionQuickPrompts = [
    "Look at me and tell me about my personality",
    "What vibe do you get from my camera?",
    "Play relaxing music on YouTube",
    "Sing me a sweet song",
    "How was your day Zoya?",
    "Tell me a joke",
  ];

  const prompts = isCaretakerMode ? caretakerQuickPrompts : companionQuickPrompts;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl flex flex-col h-[82vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 px-6 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                isCaretakerMode
                  ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-white"
                  : "bg-gradient-to-tr from-violet-500 to-pink-500 text-white"
              }`}
            >
              Z
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Conversation Transcript</h3>
              <p className="text-xs text-neutral-400">
                {isCaretakerMode ? "Caretaker & Health Dialogue History" : "Zoya Companion History"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLargeFont}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                largeFont
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white"
              }`}
              title="Toggle Large Text for Senior Readability"
            >
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">{largeFont ? "Large Font" : "Standard Font"}</span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 border border-neutral-700 text-neutral-400 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 space-y-3 p-8">
              <Bot className="w-12 h-12 text-neutral-600" />
              <p className="text-sm">No messages yet. Speak or type to start talking with Zoya!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isZoya = m.sender === "zoya";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isZoya ? "justify-start" : "justify-end"}`}
                >
                  {isZoya && (
                    <div
                      className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        isCaretakerMode
                          ? "bg-emerald-900/60 border border-emerald-500/40 text-emerald-300"
                          : "bg-pink-900/60 border border-pink-500/40 text-pink-300"
                      }`}
                    >
                      Z
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl p-4 shadow-sm ${
                      isZoya
                        ? isCaretakerMode
                          ? "bg-emerald-950/30 border border-emerald-500/30 text-emerald-100"
                          : "bg-neutral-800/90 border border-neutral-700 text-neutral-100"
                        : "bg-violet-600 text-white rounded-tr-none"
                    } ${largeFont ? "text-lg leading-relaxed font-medium" : "text-sm leading-relaxed"}`}
                  >
                    <div className="text-[10px] uppercase font-mono tracking-wider opacity-60 mb-1">
                      {isZoya ? "Zoya" : "You"}
                    </div>
                    <div>{m.text}</div>
                  </div>
                  {!isZoya && (
                    <div className="w-8 h-8 rounded-full bg-violet-900/80 border border-violet-500/40 text-violet-200 shrink-0 flex items-center justify-center text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 shrink-0">
          <div className="text-[11px] text-neutral-400 font-mono mb-2 flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
            <span>Suggested Voice / Text Questions:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onQuickPrompt(p);
                  onClose();
                }}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-500/50 border border-neutral-700 text-xs text-neutral-300 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
