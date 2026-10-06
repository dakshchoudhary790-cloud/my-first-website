import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  Volume2,
  VolumeX,
  Keyboard,
  Send,
  Video,
  Shield,
  Sparkles,
  AlertTriangle,
  Pill,
  Droplets,
  Wind,
  FileText,
  Activity,
  Bell,
  Camera,
  Eye,
  Stethoscope,
} from "lucide-react";
import {
  getZoyaResponse,
  getZoyaResponseStream,
  getZoyaAudio,
  resetZoyaSession,
} from "./services/geminiService";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import EmergencyModal from "./components/EmergencyModal";
import CaretakerDrawer from "./components/CaretakerDrawer";
import GuidedBreathingModal from "./components/GuidedBreathingModal";
import ChatTranscriptModal from "./components/ChatTranscriptModal";
import WebcamView from "./components/WebcamView";
import MedicalAdviceModal from "./components/MedicalAdviceModal";
import MedicationNotificationBanner from "./components/MedicationNotificationBanner";
import MediaActionModal from "./components/MediaActionModal";
import { playPCM, unlockAudio, speakTextFallback, playMedicationChime } from "./utils/audioUtils";
import { motion, AnimatePresence } from "motion/react";
import { AppMode, CaretakerState, CameraPosition, VisionObservation } from "./types/caretaker";
import {
  getInitialCaretakerState,
  saveCaretakerState,
} from "./services/caretakerStorage";

type AppState = "idle" | "listening" | "processing" | "speaking";

interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
}


const cameraPositionClasses: Record<CameraPosition, string> = {
  "top-right": "top-16 right-3 md:right-5",
  "bottom-right": "bottom-20 right-3 md:right-5",
  "top-left": "top-16 left-3 md:left-5",
  "bottom-left": "bottom-20 left-3 md:left-5",
  "fullscreen": "top-0 left-0 w-full h-full",
};

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");

  // App Mode: defaults to Caretaker Mode to highlight new requested capabilities
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem("zoya_app_mode");
    return (saved as AppMode) || "caretaker";
  });

  const [caretakerState, setCaretakerState] = useState<CaretakerState>(() =>
    getInitialCaretakerState()
  );

  useEffect(() => {
    localStorage.setItem("zoya_app_mode", appMode);
  }, [appMode]);

  useEffect(() => {
    saveCaretakerState(caretakerState);
  }, [caretakerState]);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("zoya_chat_history", JSON.stringify(messages));
  }, [messages]);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
    }
  }, [isMuted]);

  // Modals & Drawers state
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState<string | undefined>();
  const [emergencyObservation, setEmergencyObservation] = useState<VisionObservation | undefined>();
  const [showCaretakerDrawer, setShowCaretakerDrawer] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [largeAccessibilityFont, setLargeAccessibilityFont] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Medical Advice modal state
  const [showMedicalAdviceModal, setShowMedicalAdviceModal] = useState(false);
  const [medicalAdviceInitialQuery, setMedicalAdviceInitialQuery] = useState("");

  // Webcam & Zoya's Live Vision state
  const [showWebcam, setShowWebcam] = useState<boolean>(() => {
    const saved = localStorage.getItem("zoya_show_webcam");
    return saved !== null ? saved === "true" : true;
  });
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>(() => {
    const saved = localStorage.getItem("zoya_webcam_pos");
    return (saved as CameraPosition) || "top-right";
  });
  const [currentVision, setCurrentVision] = useState<VisionObservation | null>(null);
  const liveVisionRef = useRef<VisionObservation | null>(null);

  useEffect(() => {
    localStorage.setItem("zoya_show_webcam", String(showWebcam));
  }, [showWebcam]);

  useEffect(() => {
    localStorage.setItem("zoya_webcam_pos", cameraPosition);
  }, [cameraPosition]);

  // Medication Notification Banner State
  const [showMedReminderBanner, setShowMedReminderBanner] = useState<boolean>(false);
  const lastAlertTimestampRef = useRef<number>(0);

  // In-App YouTube & Google Search Media Modal State
  const [activeMediaModal, setActiveMediaModal] = useState<{
    type: "youtube" | "google";
    query: string;
    url: string;
  } | null>(null);

  const liveSessionRef = useRef<LiveSessionManager | null>(null);

  // Trigger Medication Voice & Audio Alert
  const triggerMedicationReminderPrompt = useCallback(
    async (pendingList?: typeof caretakerState.medications) => {
      const pending =
        pendingList || caretakerState.medications.filter((m) => !m.takenToday);
      if (pending.length === 0) return;

      setShowMedReminderBanner(true);
      lastAlertTimestampRef.current = Date.now();

      const reminderCfg = caretakerState.reminderSettings || {
        enabled: true,
        intervalMinutes: 15,
        audioPrompt: true,
        soundChime: true,
      };

      // 1. Play melodic chime if enabled
      if (reminderCfg.soundChime && !isMuted) {
        unlockAudio();
        await playMedicationChime();
      }

      // 2. Play vocal spoken reminder if enabled
      if (reminderCfg.audioPrompt && !isMuted) {
        const recipient = caretakerState.profile.recipientName || "Sir";
        const medNames = pending.map((m) => `${m.name} (${m.time})`).join(", ");
        const promptSpeech =
          pending.length === 1
            ? `Namaste ${recipient}! Aapki dawai ka samay ho gaya hai: ${medNames}. Kripya isko abhi le lijiye.`
            : `Namaste ${recipient}! Aapki ${pending.length} dawaiyaan due hain: ${medNames}. Kripya inko samay par zaroor le lijiye!`;

        // Add to transcript messages for visual continuity
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-med-alert",
            sender: "zoya",
            text: `🔔 Medication Reminder: ${promptSpeech}`,
          },
        ]);

        setAppState("speaking");
        try {
          const audioBase64 = await getZoyaAudio(promptSpeech);
          if (audioBase64) {
            await playPCM(audioBase64);
            setAppState("idle");
          } else {
            speakTextFallback(promptSpeech, () => setAppState("idle"));
          }
        } catch {
          speakTextFallback(promptSpeech, () => setAppState("idle"));
        }
      }
    },
    [caretakerState.medications, caretakerState.profile, caretakerState.reminderSettings, isMuted]
  );

  // Periodic Medication Reminder Check Effect
  useEffect(() => {
    if (appMode !== "caretaker") {
      setShowMedReminderBanner(false);
      return;
    }

    const settings = caretakerState.reminderSettings || {
      enabled: true,
      intervalMinutes: 15,
      audioPrompt: true,
      soundChime: true,
    };

    if (!settings.enabled) {
      setShowMedReminderBanner(false);
      return;
    }

    const intervalMs = Math.max(1, settings.intervalMinutes) * 60 * 1000;

    // Set lastAlertTimestamp to now on initial mount so we don't immediately prompt
    if (lastAlertTimestampRef.current === 0) {
      lastAlertTimestampRef.current = Date.now();
    }

    const checkPendingMeds = () => {
      const pending = caretakerState.medications.filter((m) => !m.takenToday);
      if (pending.length === 0) {
        setShowMedReminderBanner(false);
        return;
      }

      const now = Date.now();
      // Only prompt if the user-specified interval has elapsed
      if (now - lastAlertTimestampRef.current >= intervalMs) {
        triggerMedicationReminderPrompt(pending);
      }
    };

    // Regular interval ticker
    const timer = setInterval(() => {
      checkPendingMeds();
    }, 15000); // Check condition periodically against intervalMs

    return () => {
      clearInterval(timer);
    };
  }, [
    appMode,
    caretakerState.medications,
    caretakerState.reminderSettings,
    triggerMedicationReminderPrompt,
  ]);

  // Caretaker Action Dispatcher
  const handleCaretakerAction = useCallback(
    (action: string, payload?: any) => {
      if (action === "emergency") {
        setEmergencyReason(payload?.reason || "Emergency alert requested");
        setEmergencyObservation(payload?.observation);
        setShowEmergencyModal(true);
      } else if (action === "medical_advice") {
        setMedicalAdviceInitialQuery(payload?.query || "");
        setShowMedicalAdviceModal(true);
      } else if (action === "open_webcam" || action === "read_personality" || action === "scan_activity") {
        setShowWebcam(true);
      } else if (action === "shrink_webcam") {
        setShowWebcam(true);
        localStorage.setItem("zoya_cam_size", "micro");
      } else if (action === "close_webcam") {
        setShowWebcam(false);
      } else if (action === "log_medication") {
        setCaretakerState((prev) => {
          // Find first pending medication or specific one
          const pendingIdx = prev.medications.findIndex((m) => !m.takenToday);
          if (pendingIdx !== -1) {
            const nextMeds = [...prev.medications];
            nextMeds[pendingIdx] = { ...nextMeds[pendingIdx], takenToday: true };
            return { ...prev, medications: nextMeds };
          }
          return prev;
        });
      } else if (action === "log_water") {
        setCaretakerState((prev) => ({
          ...prev,
          waterGlasses: (prev.waterGlasses || 0) + 1,
        }));
      } else if (action === "start_breathing") {
        setShowBreathingModal(true);
      } else if (action === "check_meds") {
        setShowMedReminderBanner(true);
      } else if (action === "call_doctor") {
        if (caretakerState.profile.doctorPhone) {
          window.location.href = `tel:${caretakerState.profile.doctorPhone.replace(
            /[^\d+]/g,
            ""
          )}`;
        }
      } else if (action === "call_emergency") {
        if (caretakerState.profile.emergencyContactPhone) {
          window.location.href = `tel:${caretakerState.profile.emergencyContactPhone.replace(
            /[^\d+]/g,
            ""
          )}`;
        }
      }
    },
    [caretakerState.profile]
  );

  // Live Vision Handler: Feeds camera observation directly into Zoya
  const handleVisionUpdated = useCallback((obs: VisionObservation) => {
    setCurrentVision(obs);
    liveVisionRef.current = obs;

    // Immediately sync vision observation to active Gemini Live Session
    if (liveSessionRef.current) {
      liveSessionRef.current.updateVision(obs);
    }
  }, []);

  // Handle Live Activity recognized by camera: logs water or medication automatically
  const handleActivityRecognized = useCallback(
    (obs: VisionObservation) => {
      // 1. If drinking water recognized -> auto-log hydration
      if (obs.recognizedActivityType === "drinking_water") {
        setCaretakerState((prev) => ({
          ...prev,
          waterGlasses: (prev.waterGlasses || 0) + 1,
        }));
      }

      // 2. If taking medication recognized -> auto-mark first pending med
      if (obs.recognizedActivityType === "taking_medication") {
        setCaretakerState((prev) => {
          const pendingIdx = prev.medications.findIndex((m) => !m.takenToday);
          if (pendingIdx !== -1) {
            const next = [...prev.medications];
            next[pendingIdx] = { ...next[pendingIdx], takenToday: true };
            return { ...prev, medications: next };
          }
          return prev;
        });
      }
    },
    []
  );

  const handleTextCommand = useCallback(
    async (finalTranscript: string) => {
      if (!finalTranscript.trim()) {
        setAppState("idle");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "user", text: finalTranscript },
      ]);

      // If live session is active, send text through it
      if (isSessionActive && liveSessionRef.current) {
        liveSessionRef.current.sendText(finalTranscript);
        return;
      }

      setAppState("processing");

      // 1. Check for command (browser actions or Caretaker actions)
      const commandResult = processCommand(finalTranscript, appMode, {
        profile: caretakerState.profile,
        medications: caretakerState.medications,
        waterGlasses: caretakerState.waterGlasses,
        waterTarget: caretakerState.waterTarget,
        vitals: caretakerState.vitals,
        medicalRecords: caretakerState.medicalRecords,
      });

      if (commandResult.caretakerAction) {
        handleCaretakerAction(
          commandResult.caretakerAction,
          commandResult.payload
        );
      }

      let responseText = "";

      if (commandResult.action) {
        responseText = commandResult.action;
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-z",
            sender: "zoya",
            text: responseText,
          },
        ]);

        if (!isMuted) {
          setAppState("speaking");
          unlockAudio();
          getZoyaAudio(responseText).then(async (audioBase64) => {
            if (audioBase64) {
              await playPCM(audioBase64);
              setAppState("idle");
            } else {
              // High reliability fallback: native voice synthesizer
              speakTextFallback(responseText, () => setAppState("idle"));
            }
          }).catch(() => {
            speakTextFallback(responseText, () => setAppState("idle"));
          });
        } else {
          setAppState("idle");
        }

        if (commandResult.mediaType && commandResult.searchQuery && commandResult.url) {
          setActiveMediaModal({
            type: commandResult.mediaType,
            query: commandResult.searchQuery,
            url: commandResult.url,
          });
        } else if (commandResult.url) {
          setTimeout(() => {
            window.open(commandResult.url, "_blank");
          }, 800);
        }
      } else {
        // 2. High-speed Streaming Response via Gemini
        const messageId = Date.now().toString() + "-z";
        
        // Add placeholder message immediately for instant visual feedback
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            sender: "zoya",
            text: "",
          },
        ]);

        responseText = await getZoyaResponseStream(
          finalTranscript,
          (streamedText) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId ? { ...msg, text: streamedText } : msg
              )
            );
          },
          messagesRef.current,
          appMode,
          {
            profile: caretakerState.profile,
            medications: caretakerState.medications,
            waterGlasses: caretakerState.waterGlasses,
            waterTarget: caretakerState.waterTarget,
            vitals: caretakerState.vitals,
            medicalRecords: caretakerState.medicalRecords,
            liveVision: liveVisionRef.current,
          }
        );

        if (!isMuted && responseText) {
          setAppState("speaking");
          unlockAudio();
          getZoyaAudio(responseText).then(async (audioBase64) => {
            if (audioBase64) {
              await playPCM(audioBase64);
              setAppState("idle");
            } else {
              // High reliability fallback: native voice synthesizer
              speakTextFallback(responseText, () => setAppState("idle"));
            }
          }).catch(() => {
            speakTextFallback(responseText, () => setAppState("idle"));
          });
        } else {
          setAppState("idle");
        }
      }
    },
    [isMuted, isSessionActive, appMode, caretakerState, handleCaretakerAction]
  );

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    unlockAudio();
    if (isSessionActive) {
      setIsSessionActive(false);
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
        liveSessionRef.current = null;
      }
      setAppState("idle");
      resetZoyaSession();
    } else {
      try {
        setIsSessionActive(true);
        resetZoyaSession();

        const session = new LiveSessionManager(appMode, {
          profile: caretakerState.profile,
          medications: caretakerState.medications,
          waterGlasses: caretakerState.waterGlasses,
          waterTarget: caretakerState.waterTarget,
          vitals: caretakerState.vitals,
          medicalRecords: caretakerState.medicalRecords,
          liveVision: liveVisionRef.current,
        });

        session.isMuted = isMuted;
        liveSessionRef.current = session;

        session.onStateChange = (state) => {
          setAppState(state);
        };

        session.onMessage = (sender, text) => {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString() + "-" + sender, sender, text },
          ]);
        };

        session.onCommand = (url) => {
          if (url.includes("youtube.com")) {
            const queryMatch = url.match(/search_query=([^&]+)/);
            const query = queryMatch ? decodeURIComponent(queryMatch[1]) : "video";
            setActiveMediaModal({
              type: "youtube",
              query,
              url,
            });
          } else if (url.includes("google.com/search")) {
            const queryMatch = url.match(/q=([^&]+)/);
            const query = queryMatch ? decodeURIComponent(queryMatch[1]) : "search";
            setActiveMediaModal({
              type: "google",
              query,
              url,
            });
          } else {
            setTimeout(() => {
              window.open(url, "_blank");
            }, 1000);
          }
        };

        session.onCaretakerAction = (action, payload) => {
          handleCaretakerAction(action, payload);
        };

        await session.start();
      } catch (e) {
        console.error("Failed to start session", e);
        setShowPermissionModal(true);
        setIsSessionActive(false);
        setAppState("idle");
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    handleTextCommand(textInput);
    setTextInput("");
    setShowTextInput(false);
  };

  const pendingMedsCount = caretakerState.medications.filter(
    (m) => !m.takenToday
  ).length;

  return (
    <div
      className={`h-[100dvh] w-screen text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0 select-none ${
        appMode === "caretaker" ? "bg-[#03090b]" : "bg-[#050505]"
      }`}
    >
      {/* Permission modal */}
      {showPermissionModal && (
        <PermissionModal onClose={() => setShowPermissionModal(false)} />
      )}

      {/* Emergency SOS Modal */}
      {showEmergencyModal && (
        <EmergencyModal
          profile={caretakerState.profile}
          medications={caretakerState.medications}
          reason={emergencyReason}
          observation={emergencyObservation}
          onClose={() => {
            setShowEmergencyModal(false);
            setEmergencyReason(undefined);
            setEmergencyObservation(undefined);
          }}
        />
      )}

      {/* Clinical Medical Advice & Health Hub Modal */}
      {showMedicalAdviceModal && (
        <MedicalAdviceModal
          profile={caretakerState.profile}
          medications={caretakerState.medications}
          vitals={caretakerState.vitals}
          medicalRecords={caretakerState.medicalRecords}
          initialQuery={medicalAdviceInitialQuery}
          onUpdateVitals={(newVitals) => {
            setCaretakerState((prev) => ({
              ...prev,
              vitals: newVitals,
            }));
          }}
          onClose={() => {
            setShowMedicalAdviceModal(false);
            setMedicalAdviceInitialQuery("");
          }}
        />
      )}

      {/* Caretaker Management Drawer */}
      {showCaretakerDrawer && (
        <CaretakerDrawer
          state={caretakerState}
          onUpdateState={setCaretakerState}
          onTriggerSOS={(reason) => {
            setEmergencyReason(reason || "Manual SOS trigger from Caretaker Hub");
            setShowEmergencyModal(true);
          }}
          onStartBreathing={() => {
            setShowCaretakerDrawer(false);
            setShowBreathingModal(true);
          }}
          onClose={() => setShowCaretakerDrawer(false)}
        />
      )}

      {/* Guided Breathing Modal */}
      {showBreathingModal && (
        <GuidedBreathingModal onClose={() => setShowBreathingModal(false)} />
      )}

      {/* YouTube & Google Search In-App Media Action Modal */}
      {activeMediaModal && (
        <MediaActionModal
          mediaData={activeMediaModal}
          onClose={() => setActiveMediaModal(null)}
        />
      )}

      {/* Chat Transcript Modal */}
      {showTranscriptModal && (
        <ChatTranscriptModal
          messages={messages}
          largeFont={largeAccessibilityFont}
          onToggleLargeFont={() =>
            setLargeAccessibilityFont(!largeAccessibilityFont)
          }
          onClear={() => {
            if (confirm("Clear dialogue history?")) {
              setMessages([]);
              resetZoyaSession();
            }
          }}
          onClose={() => setShowTranscriptModal(false)}
          onQuickPrompt={(prompt) => handleTextCommand(prompt)}
          isCaretakerMode={appMode === "caretaker"}
        />
      )}

      {/* Ambient Lighting Gradients */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {appMode === "caretaker" ? (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[140px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-teal-900/20 blur-[140px] rounded-full" />
            <div className="absolute top-[40%] right-[-10%] w-[35%] h-[35%] bg-amber-900/10 blur-[130px] rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 blur-[120px] rounded-full" />
          </>
        )}
      </div>

      {/* Top Header */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center z-20 shrink-0 px-4 py-3 md:px-8 md:py-4">
        {/* Brand & Mode Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition-all ${
              appMode === "caretaker"
                ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-neutral-950 font-mono"
                : "bg-gradient-to-tr from-violet-500 to-pink-500 text-white"
            }`}
          >
            {appMode === "caretaker" ? (
              <Shield className="w-5 h-5 text-neutral-950" />
            ) : (
              "Z"
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wide">Zoya</h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                  appMode === "caretaker"
                    ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                    : "bg-violet-950/80 text-violet-300 border-violet-500/40"
                }`}
              >
                {appMode === "caretaker" ? "Caretaker Mode" : "Companion"}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {appMode === "caretaker"
                ? `Loving Health Guardian for ${
                    caretakerState.profile.recipientName || "Ashwani"
                  }`
                : "Indian Female AI Voice Assistant"}
            </p>
          </div>
        </div>

        {/* Center / Right Control Actions */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-white/5 border border-white/10 rounded-full p-1 flex items-center gap-1 backdrop-blur-md">
            <button
              onClick={() => {
                setAppMode("caretaker");
                resetZoyaSession();
                if (isSessionActive && liveSessionRef.current) {
                  liveSessionRef.current.stop();
                  setIsSessionActive(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                appMode === "caretaker"
                  ? "bg-emerald-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Switch to Caretaker Mode for health & eldercare"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Caretaker</span>
            </button>

            <button
              onClick={() => {
                setAppMode("companion");
                resetZoyaSession();
                if (isSessionActive && liveSessionRef.current) {
                  liveSessionRef.current.stop();
                  setIsSessionActive(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                appMode === "companion"
                  ? "bg-violet-500 text-white shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Switch to Companion Mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Companion</span>
            </button>
          </div>

          {/* SOS Button (Always accessible, highlighted in Caretaker Mode) */}
          <button
            onClick={() => {
              setEmergencyReason("SOS emergency button tapped from header");
              setShowEmergencyModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-transform active:scale-95 animate-pulse"
            title="Immediate Emergency / Medical Alert"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">SOS</span>
          </button>

          {/* Caretaker Health Hub Button */}
          {appMode === "caretaker" && (
            <button
              onClick={() => setShowCaretakerDrawer(true)}
              className="relative p-2 rounded-full bg-white/5 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors"
              title="Open Caretaker Health Hub (Meds, Hydration, Records)"
            >
              <Activity className="w-4 h-4" />
              {pendingMedsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-neutral-950 font-mono text-[10px] font-bold flex items-center justify-center">
                  {pendingMedsCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Medical Advice Button */}
          <button
            onClick={() => {
              setMedicalAdviceInitialQuery("");
              setShowMedicalAdviceModal(true);
            }}
            className="p-2 rounded-full bg-white/5 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-colors"
            title="Open Medical Advice & Clinical Health Guide"
          >
            <Stethoscope className="w-4 h-4" />
          </button>

          {/* Transcript / Subtitles button */}
          <button
            onClick={() => setShowTranscriptModal(true)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-neutral-300"
            title="View Full Conversation Transcript & Captions"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Webcam & AI Eye Toggle */}
          <button
            onClick={() => setShowWebcam(!showWebcam)}
            className={`p-2 rounded-full transition-colors border flex items-center gap-1.5 ${
              showWebcam
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                : "bg-white/5 hover:bg-white/10 text-neutral-300 border-white/10"
            }`}
            title="Toggle Live Webcam & AI Eye Perception"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden xl:inline text-xs font-semibold">AI Eye</span>
          </button>


          {/* Video Avatar Upload */}
          <label
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 cursor-pointer flex items-center justify-center"
            title="Upload Video Avatar"
          >
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setVideoSrc(URL.createObjectURL(file));
                }
              }}
            />
            <Video size={16} className="opacity-70 text-neutral-300" />
          </label>

          {/* Mute/Unmute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-neutral-300"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main HUD & Visualizer */}
      <main className="absolute inset-0 flex flex-col justify-between w-full h-full z-10 overflow-hidden pt-20 pb-28 px-4 md:px-8 pointer-events-none">
        {/* Top Caretaker Quick Status Pills */}
        {appMode === "caretaker" && (
          <div className="w-full flex justify-center pointer-events-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 bg-neutral-900/70 border border-emerald-500/30 rounded-2xl px-3 py-1.5 backdrop-blur-md shadow-lg text-xs">
              {/* Meds badge */}
              <button
                onClick={() => setShowCaretakerDrawer(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-800/80 hover:bg-emerald-950/60 text-emerald-300 transition-colors"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>
                  Meds:{" "}
                  {caretakerState.medications.filter((m) => m.takenToday).length}/
                  {caretakerState.medications.length}
                </span>
              </button>

              {/* Water badge */}
              <button
                onClick={() =>
                  setCaretakerState((prev) => ({
                    ...prev,
                    waterGlasses: (prev.waterGlasses || 0) + 1,
                  }))
                }
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-800/80 hover:bg-cyan-950/60 text-cyan-300 transition-colors"
                title="Click to add +1 glass"
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>
                  Water: {caretakerState.waterGlasses}/
                  {caretakerState.waterTarget} gls
                </span>
              </button>

              {/* Medical Advice pill */}
              <button
                onClick={() => {
                  setMedicalAdviceInitialQuery("");
                  setShowMedicalAdviceModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-800/80 hover:bg-cyan-950/60 text-cyan-300 transition-colors"
                title="Clinical Medical Advice & Vitals Assessment"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Medical Advice</span>
              </button>

              {/* Guided Breath button */}
              <button
                onClick={() => setShowBreathingModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-800/80 hover:bg-teal-950/60 text-teal-300 transition-colors"
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Calm Breath</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Medication Notification Banner */}
        {appMode === "caretaker" && showMedReminderBanner && (
          <div className="w-full pt-2">
            <MedicationNotificationBanner
              pendingMeds={caretakerState.medications.filter((m) => !m.takenToday)}
              profile={caretakerState.profile}
              onTakeMedication={(id) => {
                setCaretakerState((prev) => ({
                  ...prev,
                  medications: prev.medications.map((m) =>
                    m.id === id ? { ...m, takenToday: true } : m
                  ),
                }));
              }}
              onTakeAllPending={() => {
                setCaretakerState((prev) => ({
                  ...prev,
                  medications: prev.medications.map((m) => ({
                    ...m,
                    takenToday: true,
                  })),
                }));
                setShowMedReminderBanner(false);
              }}
              onDismiss={() => setShowMedReminderBanner(false)}
              onRepeatAudio={() => triggerMedicationReminderPrompt()}
            />
          </div>
        )}

        {/* Visualizer & Video Avatar in Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {videoSrc ? (
            <video
              src={videoSrc}
              autoPlay
              loop
              muted={true}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <Visualizer state={appState} mode={appMode} />
          )}
        </div>

        {/* Status indicator on side */}
        <div className="w-full flex justify-between items-center pointer-events-none z-10 px-4">
          <div className="h-6">
            <AnimatePresence>
              {appState === "processing" && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center gap-2 text-sm italic font-serif ${
                    appMode === "caretaker"
                      ? "text-emerald-300"
                      : "text-cyan-300/80"
                  }`}
                >
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {appMode === "caretaker"
                      ? "Zoya is here..."
                      : "Replying..."}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6">
            <AnimatePresence>
              {appState === "listening" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center gap-2 text-sm italic ${
                    appMode === "caretaker"
                      ? "text-emerald-300"
                      : "text-violet-300/80"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      appMode === "caretaker" ? "bg-emerald-400" : "bg-violet-400"
                    }`}
                  />
                  <span>Listening...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-center pb-5 md:pb-7 z-20 shrink-0 gap-3">
        {/* Text Input Drawer */}
        <AnimatePresence>
          {showTextInput && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onSubmit={handleTextSubmit}
              className="w-full max-w-md flex items-center gap-2 bg-neutral-900/90 border border-neutral-700 rounded-full p-1.5 pl-4 backdrop-blur-md shadow-2xl"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  appMode === "caretaker"
                    ? "Ask Zoya (e.g. 'I took my medicine', 'How are you?')..."
                    : "Type a message to Zoya..."
                }
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm"
                autoFocus
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className={`p-2 rounded-full text-white transition-colors ${
                  appMode === "caretaker"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-violet-600 hover:bg-violet-500"
                } disabled:opacity-40`}
              >
                <Send size={16} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 relative">
          {/* Main Voice Toggle Button */}
          <button
            onClick={toggleListening}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-full font-medium tracking-wide transition-all duration-300 shadow-2xl
              ${
                isSessionActive
                  ? "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30"
                  : appMode === "caretaker"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 hover:scale-105 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105"
              }
            `}
          >
            {isSessionActive ? (
              <>
                <MicOff size={20} />
                <span className="font-semibold">End Voice Session</span>
              </>
            ) : (
              <>
                <Mic size={20} className="group-hover:animate-bounce" />
                <span className="font-semibold">
                  {appMode === "caretaker" ? "Talk to Caretaker Zoya" : "Start Voice Session"}
                </span>
              </>
            )}
          </button>

          {/* Keyboard input toggle */}
          {!isSessionActive && (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shadow-2xl"
              title="Type message instead of speaking"
            >
              <Keyboard size={20} className="opacity-70" />
            </button>
          )}

          {/* Quick Hub shortcut in caretaker mode */}
          {appMode === "caretaker" && !isSessionActive && (
            <button
              onClick={() => setShowCaretakerDrawer(true)}
              className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 transition-colors shadow-2xl"
              title="Open Caretaker Health Schedule"
            >
              <Pill size={20} />
            </button>
          )}
        </div>
      </footer>

      {/* Floating Live Webcam & AI Eye Perception HUD */}
      <AnimatePresence>
        {showWebcam && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`fixed ${cameraPositionClasses[cameraPosition]} z-30 pointer-events-auto`}
          >
            <WebcamView
              mode={appMode}
              profile={caretakerState.profile}
              position={cameraPosition}
              isSessionActive={isSessionActive}
              onChangePosition={(newPos) => setCameraPosition(newPos)}
              onClose={() => setShowWebcam(false)}
              onOpenPermissionGuide={() => setShowPermissionModal(true)}
              onVisionUpdated={handleVisionUpdated}
              onActivityRecognized={handleActivityRecognized}
              onEmergencyDetected={(reason, obs) => {
                setEmergencyReason(reason);
                setEmergencyObservation(obs);
                setShowEmergencyModal(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
