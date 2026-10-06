import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  ShieldCheck,
  HeartPulse,
  Volume2,
  VolumeX,
  MapPin,
  Copy,
  Check,
  UserCheck,
  Stethoscope,
} from "lucide-react";
import { CareProfile, Medication, VisionObservation } from "../types/caretaker";

interface EmergencyModalProps {
  profile: CareProfile;
  medications: Medication[];
  reason?: string;
  observation?: VisionObservation;
  onClose: () => void;
}

export default function EmergencyModal({
  profile,
  medications,
  reason,
  observation,
  onClose,
}: EmergencyModalProps) {
  const [isSirenMuted, setIsSirenMuted] = useState(false);
  const [copiedType, setCopiedType] = useState<"child" | "doctor" | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play a soft pulsing medical alert chime/siren using Web Audio API
  useEffect(() => {
    let intervalId: any = null;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.connect(ctx.destination);

      let high = true;
      const playPulse = () => {
        if (isSirenMuted || !audioCtxRef.current || audioCtxRef.current.state === "closed") return;
        const now = audioCtxRef.current.currentTime;
        const osc = audioCtxRef.current.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(high ? 880 : 660, now);
        high = !high;

        const pulseGain = audioCtxRef.current.createGain();
        pulseGain.gain.setValueAtTime(0, now);
        pulseGain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        pulseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(pulseGain);
        pulseGain.connect(gain);

        osc.start(now);
        osc.stop(now + 0.4);
      };

      playPulse();
      intervalId = setInterval(playPulse, 600);
    } catch (e) {
      console.error("Audio alert error", e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [isSirenMuted]);

  const toggleSiren = () => {
    setIsSirenMuted(!isSirenMuted);
  };

  const recipient = profile.recipientName || "Sir";
  const childName = profile.guardianName || profile.emergencyContactName || "Family / Guardian";
  const doctorName = profile.doctorName || "Attending Doctor";
  const cleanChildPhone = (profile.emergencyContactPhone || "").replace(/[^\d+]/g, "");
  const cleanDocPhone = (profile.doctorPhone || "").replace(/[^\d+]/g, "");

  const emergencyDetails = reason || "Immediate emergency assistance requested";

  const eventTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // 1. Emergency Message to Child / Guardian
  const getChildMessageText = () => {
    return (
      `🚨 *URGENT MEDICAL EMERGENCY ALERT FOR FAMILY (${childName})* 🚨\n\n` +
      `Care Recipient: *${recipient}* (Age: ${profile.age || "Senior"})\n` +
      `⚠️ *Alert Reason:* ${emergencyDetails}\n` +
      `⏰ *Time:* ${eventTime}\n` +
      `📍 *Location:* ${profile.homeAddress || "Home"}\n\n` +
      `*Medical Summary:*\n` +
      `- Blood Group: ${profile.bloodGroup || "Standard"}\n` +
      `- Conditions: ${profile.conditions || "None noted"}\n` +
      `- Allergies: ${profile.allergies || "None noted"}\n\n` +
      `⚡ *Action Required:* Please call or check on ${recipient} immediately or dispatch emergency aid!`
    );
  };

  // 2. Emergency Message to Doctor
  const getDoctorMessageText = () => {
    const medList =
      medications.length > 0
        ? medications.map((m) => `${m.name} (${m.dosage})`).join(", ")
        : "None logged";
    return (
      `🩺 *URGENT PHYSICIAN ALERT FOR DR. ${doctorName.toUpperCase()}* 🩺\n\n` +
      `Patient: *${recipient}* (Age: ${profile.age || "Senior"})\n` +
      `⚠️ *Trigger Event:* Emergency SOS Alert (${emergencyDetails})\n` +
      `⏰ *Time of Incident:* ${eventTime}\n` +
      `📍 *Patient Address:* ${profile.homeAddress || "Home"}\n\n` +
      `*Clinical Snapshot:*\n` +
      `- Diagnosed Conditions: ${profile.conditions || "None noted"}\n` +
      `- Current Daily Medications: ${medList}\n` +
      `- Blood Group: ${profile.bloodGroup || "Standard"}\n` +
      `- Allergies: ${profile.allergies || "None noted"}\n\n` +
      `Dr. ${doctorName}, please advise on urgent triage or confirm hospital dispatch.`
    );
  };

  const copyMessage = (type: "child" | "doctor") => {
    const text = type === "child" ? getChildMessageText() : getDoctorMessageText();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border-2 border-red-500/80 rounded-3xl shadow-[0_0_70px_rgba(239,68,68,0.45)] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Urgent Animated Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-6 py-4 flex items-center justify-between text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl animate-pulse">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-wider uppercase font-mono">
                  Emergency Medical SOS Alert
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-950 text-white text-[10px] font-bold border border-red-400">
                  SOS TRIGGERED
                </span>
              </div>
              <p className="text-xs text-red-100 font-sans">
                Emergency Dispatch Protocol for Family & Physician
              </p>
            </div>
          </div>
          <button
            onClick={toggleSiren}
            className="p-2.5 rounded-xl bg-black/20 hover:bg-black/40 transition-colors"
            title={isSirenMuted ? "Unmute Alarm Siren" : "Mute Alarm Siren"}
          >
            {isSirenMuted ? (
              <VolumeX className="w-5 h-5 text-white/80" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-neutral-100">
          {/* Emergency Reason Box */}
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-red-400" />
                <span>Urgent Emergency Alert</span>
              </span>
              <span className="text-[11px] font-mono text-red-200 bg-red-900/60 px-2 py-0.5 rounded-md border border-red-700">
                {eventTime}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-start gap-2 text-sm text-white">
                <p>
                  <strong className="text-red-200 font-semibold">Incident:</strong>{" "}
                  <span className="font-bold text-white">{emergencyDetails}</span>
                </p>
              </div>

              {observation && (
                <div className="pt-1.5 border-t border-red-500/20 text-xs space-y-1 text-red-100">
                  <p>
                    <strong>Webcam Observation:</strong> {observation.activity} ({observation.bodyLanguage})
                  </p>
                  {observation.emergencyReason && (
                    <p className="text-red-300 font-mono text-[11px]">
                      Reason: {observation.emergencyReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Notify Child & Doctor */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
              Send Instant Emergency Messages:
            </h3>

            {/* ACTION 1: Emergency Message to Child */}
            <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700 hover:border-emerald-500/50 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Notify Family: {childName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/40">
                        Primary Guardian
                      </span>
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      {profile.emergencyContactPhone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyMessage("child")}
                  className="p-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                  title="Copy Child Alert Text"
                >
                  {copiedType === "child" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://web.whatsapp.com/send?phone=${cleanChildPhone}&text=${encodeURIComponent(
                    getChildMessageText()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 text-xs text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp to Guardian</span>
                </a>

                <a
                  href={`tel:${cleanChildPhone || "112"}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-xl transition-transform active:scale-95 text-xs text-center"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Direct Call to Guardian</span>
                </a>
              </div>
            </div>

            {/* ACTION 2: Emergency Message to Doctor */}
            <div className="p-4 rounded-2xl bg-neutral-800/80 border border-neutral-700 hover:border-cyan-500/50 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Notify Doctor: {doctorName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-300 rounded border border-cyan-500/40">
                        Physician
                      </span>
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      {profile.doctorPhone}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyMessage("doctor")}
                  className="p-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-white transition-colors text-xs flex items-center gap-1"
                  title="Copy Doctor Clinical Alert Text"
                >
                  {copiedType === "doctor" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[10px] text-cyan-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://web.whatsapp.com/send?phone=${cleanDocPhone}&text=${encodeURIComponent(
                    getDoctorMessageText()
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-md transition-transform active:scale-95 text-xs text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp to Doctor</span>
                </a>

                <a
                  href={`tel:${cleanDocPhone}`}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-xl transition-transform active:scale-95 text-xs text-center"
                >
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>Direct Call to Doctor</span>
                </a>
              </div>
            </div>

            {/* ACTION 3: National Emergency Services */}
            <div className="pt-1">
              <a
                href="tel:112"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-98 text-xs text-center"
              >
                <Phone className="w-4 h-4 animate-bounce" />
                <span>Call Emergency Ambulance & Services (112)</span>
              </a>
            </div>
          </div>

          {/* Location & Patient Medical Snapshot Card */}
          <div className="bg-neutral-950/60 rounded-2xl p-4 border border-neutral-800 text-xs space-y-2.5">
            {profile.homeAddress && (
              <div className="flex items-start gap-2 text-neutral-300 pb-2 border-b border-neutral-800">
                <MapPin className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Patient Address:</span>
                  <span>{profile.homeAddress}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-neutral-300">
              <div>
                <span className="text-neutral-500 block">Blood Group:</span>
                <span className="font-bold text-red-400">
                  {profile.bloodGroup || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Diagnosed Conditions:</span>
                <span className="font-medium text-neutral-200">
                  {profile.conditions || "None recorded"}
                </span>
              </div>
            </div>

            {medications.length > 0 && (
              <div className="pt-1 text-neutral-400">
                <span className="text-[11px] block mb-1">
                  Active Prescribed Medications:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {medications.map((m) => (
                    <span
                      key={m.id}
                      className="px-2 py-0.5 bg-neutral-800 text-neutral-200 rounded text-[10px]"
                    >
                      {m.name} ({m.dosage})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Stand-down button */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
          <p className="text-xs text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zoya AI Health Guardian</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors border border-neutral-700 shadow-sm"
          >
            I Am Safe / Cancel Alert
          </button>
        </div>
      </div>
    </div>
  );
}
