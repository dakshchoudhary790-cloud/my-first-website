import React from "react";
import { Bell, CheckCircle2, X, Volume2, Clock, Sparkles } from "lucide-react";
import { Medication, CareProfile } from "../types/caretaker";
import { motion, AnimatePresence } from "motion/react";

interface MedicationNotificationBannerProps {
  pendingMeds: Medication[];
  profile?: CareProfile;
  onTakeMedication: (id: string) => void;
  onTakeAllPending: () => void;
  onDismiss: () => void;
  onRepeatAudio: () => void;
}

export default function MedicationNotificationBanner({
  pendingMeds,
  profile,
  onTakeMedication,
  onTakeAllPending,
  onDismiss,
  onRepeatAudio,
}: MedicationNotificationBannerProps) {
  if (pendingMeds.length === 0) return null;

  const recipientName = profile?.recipientName || "Sir";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-xl mx-auto px-4 z-40 pointer-events-auto"
      >
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/95 via-neutral-900/95 to-emerald-950/95 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-[0_0_35px_rgba(16,185,129,0.35)] backdrop-blur-xl text-white">
          {/* Subtle glowing animated pulse border */}
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse pointer-events-none" />

          <div className="relative flex items-start justify-between gap-3">
            {/* Icon & Title */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg mt-0.5">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm sm:text-base text-emerald-200 tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Medication Alert for {recipientName}</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {pendingMeds.length} Due Today
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1 leading-snug">
                  Kripya samay par apni dawai le lijiye taaki aapki tabiyat bilkul fit rahe!
                </p>
              </div>
            </div>

            {/* Close / Dismiss */}
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Snooze / Dismiss for now"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pending Medicines Pill List */}
          <div className="mt-3.5 space-y-2">
            {pendingMeds.map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-900/90 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-ping" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-white truncate">
                        {med.name}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-emerald-300 border border-emerald-500/20">
                        <Clock className="w-2.5 h-2.5" />
                        {med.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {med.dosage} {med.notes ? `• ${med.notes}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onTakeMedication(med.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 transition-transform active:scale-95 shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Taken</span>
                </button>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="mt-3.5 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2 text-xs">
            <button
              onClick={onRepeatAudio}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-500/10"
              title="Hear voice reminder from Zoya again"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Voice Prompt</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors text-xs"
              >
                Remind Later
              </button>

              {pendingMeds.length > 1 && (
                <button
                  onClick={onTakeAllPending}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-all shadow-md active:scale-95 text-xs"
                >
                  Mark All Taken
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
