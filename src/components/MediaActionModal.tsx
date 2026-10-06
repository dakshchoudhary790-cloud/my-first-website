import React, { useState } from "react";
import { Youtube, X, ExternalLink, Play, Search, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MediaActionModalProps {
  mediaData: {
    type: "youtube" | "google";
    query: string;
    url: string;
  } | null;
  onClose: () => void;
}

export default function MediaActionModal({
  mediaData,
  onClose,
}: MediaActionModalProps) {
  const [embedError, setEmbedError] = useState(false);

  if (!mediaData) return null;

  const isYouTube = mediaData.type === "youtube";
  // Convert search query to YouTube embed search URL or direct search
  // When user asks "play X on youtube", we can embed YouTube's search embed or direct link
  const embedUrl = isYouTube
    ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
        mediaData.query
      )}&autoplay=1`
    : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0d1317] border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col text-white"
        >
          {/* Header */}
          <div className="px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isYouTube
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                }`}
              >
                {isYouTube ? (
                  <Youtube className="w-5 h-5 text-red-500" />
                ) : (
                  <Search className="w-5 h-5 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  {isYouTube ? "YouTube Video Player" : "Google Search Results"}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Voice Activated
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 truncate max-w-xs sm:max-w-md">
                  Query: <span className="text-emerald-300 font-medium">"{mediaData.query}"</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={mediaData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
                title="Open in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in Tab</span>
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Body */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
            {isYouTube && !embedError ? (
              <iframe
                src={embedUrl || ""}
                title={`YouTube video for ${mediaData.query}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
                onError={() => setEmbedError(true)}
              />
            ) : (
              /* Google Search or Fallback Card */
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    isYouTube
                      ? "bg-red-500/20 text-red-400"
                      : "bg-blue-500/20 text-blue-400"
                  } border border-white/10 shadow-xl`}
                >
                  {isYouTube ? (
                    <Play className="w-8 h-8 text-red-400 ml-1" />
                  ) : (
                    <Search className="w-8 h-8 text-blue-400" />
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-lg text-white">
                    {isYouTube
                      ? `Play "${mediaData.query}" on YouTube`
                      : `Search Google for "${mediaData.query}"`}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                    {isYouTube
                      ? "Ready to watch. Click below to launch YouTube with instant playback of the best matching video."
                      : "Google search is ready with live information, answers, and articles."}
                  </p>
                </div>

                <a
                  href={mediaData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-transform active:scale-95 ${
                    isYouTube
                      ? "bg-red-600 hover:bg-red-500 text-white"
                      : "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>
                    {isYouTube ? "Launch on YouTube Now" : "Open Google Search"}
                  </span>
                </a>
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="px-5 py-3 bg-neutral-900/60 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Zoya executed command: "{mediaData.query}"
            </span>

            <div className="flex items-center gap-3">
              <a
                href={mediaData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Direct Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
