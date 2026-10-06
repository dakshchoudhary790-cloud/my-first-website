import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Video,
  VideoOff,
  Eye,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  FlipHorizontal,
  Activity,
  Droplets,
  Pill,
  Scan,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Users,
  Shirt,
} from "lucide-react";
import { AppMode, CareProfile, CameraPosition, VisionObservation } from "../types/caretaker";
import { captureFrameFromVideo, analyzeWebcamFrameWithAIEye } from "../services/webcamVisionService";

export type CamSize = "micro" | "compact" | "standard";

interface WebcamViewProps {
  mode: AppMode;
  profile: CareProfile;
  position: CameraPosition;
  isSessionActive: boolean;
  onChangePosition: (pos: CameraPosition) => void;
  onClose: () => void;
  onOpenPermissionGuide: () => void;
  onVisionUpdated?: (obs: VisionObservation) => void;
  onActivityRecognized?: (obs: VisionObservation) => void;
  onEmergencyDetected?: (reason: string, obs: VisionObservation) => void;
}

export default function WebcamView({
  mode,
  profile,
  position,
  isSessionActive,
  onChangePosition,
  onClose,
  onOpenPermissionGuide,
  onVisionUpdated,
  onActivityRecognized,
  onEmergencyDetected,
}: WebcamViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Size states: Defaults to "compact" (super small as requested)
  const [camSize, setCamSize] = useState<CamSize>(() => {
    const saved = localStorage.getItem("zoya_cam_size");
    return (saved as CamSize) || "compact";
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"people_clothes" | "body_posture" | "personality">("people_clothes");
  const [autoScanInterval, setAutoScanInterval] = useState<number>(15); // seconds
  const [lastObservation, setLastObservation] = useState<VisionObservation | null>(null);

  useEffect(() => {
    localStorage.setItem("zoya_cam_size", camSize);
  }, [camSize]);

  // Start webcam stream
  const startCamera = useCallback(async () => {
    try {
      setStreamError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn("Video play error:", e));
      }

      setStreamActive(true);
      setIsPaused(false);
    } catch (err: any) {
      console.warn("Webcam error:", err);
      setStreamActive(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStreamError("Camera permission blocked.");
      } else {
        setStreamError("No webcam found.");
      }
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // AI Eye scan function: Shares live details directly to Zoya
  const performAIEyeScan = useCallback(
    async (focusType: "all" | "personality" | "activity" = "all") => {
      if (!videoRef.current || isScanning || !streamActive || isPaused) return;

      const base64Jpeg = captureFrameFromVideo(videoRef.current, 480);
      if (!base64Jpeg) return;

      setIsScanning(true);
      try {
        const obs = await analyzeWebcamFrameWithAIEye(base64Jpeg, mode, focusType, profile);
        setLastObservation(obs);

        // Directly feed live vision details into Zoya
        if (onVisionUpdated) {
          onVisionUpdated(obs);
        }

        if (onActivityRecognized) {
          onActivityRecognized(obs);
        }

        if (obs.emergencyDetected && onEmergencyDetected) {
          onEmergencyDetected(
            obs.emergencyReason || "Abnormal activity or physical distress observed in webcam",
            obs
          );
        }
      } catch (err) {
        console.error("AI Eye scan error:", err);
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, streamActive, isPaused, mode, profile, onVisionUpdated, onActivityRecognized, onEmergencyDetected]
  );

  // Periodic auto-scan
  useEffect(() => {
    if (!streamActive || isPaused || autoScanInterval <= 0) return;

    const intervalMs = autoScanInterval * 1000;
    const timer = setInterval(() => {
      performAIEyeScan("all");
    }, intervalMs);

    const initialTimer = setTimeout(() => {
      if (!lastObservation) {
        performAIEyeScan("all");
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
    };
  }, [streamActive, isPaused, autoScanInterval, performAIEyeScan, lastObservation]);

  const togglePause = () => {
    if (!videoRef.current) return;
    if (isPaused) {
      videoRef.current.play().catch(() => {});
      setIsPaused(false);
    } else {
      videoRef.current.pause();
      setIsPaused(true);
    }
  };

  const cycleSize = () => {
    if (camSize === "micro") setCamSize("compact");
    else if (camSize === "compact") setCamSize("standard");
    else setCamSize("micro");
  };

  const isFullscreen = position === "fullscreen";

  // Ultra-minimized floating pill mode
  if (isMinimized && !isFullscreen) {
    return (
      <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-full px-2.5 py-1 shadow-lg flex items-center gap-1.5 text-neutral-200 select-none cursor-pointer hover:border-sky-500/50 transition-all">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
        </span>
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1 text-[10px] font-semibold text-sky-300"
          title="Click to restore live webcam"
        >
          <Eye className="w-3 h-3 text-sky-400" />
          <span>Zoya&apos;s Vision (Live)</span>
        </button>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-0.5"
          title="Close"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    );
  }

  // Size width classes:
  const widthClass = isFullscreen
    ? "fixed inset-4 md:inset-8 z-40 max-w-4xl mx-auto"
    : isExpanded
    ? "w-[280px] sm:w-[320px] max-h-[85vh]"
    : camSize === "micro"
    ? "w-[100px] sm:w-[110px]"
    : camSize === "standard"
    ? "w-[165px] sm:w-[180px]"
    : "w-[125px] sm:w-[135px]";

  return (
    <div
      className={`bg-neutral-900/95 backdrop-blur-xl border border-neutral-700/80 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden text-neutral-100 transition-all duration-200 select-none ${widthClass}`}
    >
      {/* Sleek Mini Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-neutral-950/90 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-1">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                streamActive && !isPaused ? "bg-emerald-400" : "bg-neutral-500"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                streamActive && !isPaused ? "bg-emerald-500" : "bg-neutral-600"
              }`}
            />
          </span>
          <span className="text-[10px] font-bold tracking-tight text-white flex items-center gap-1">
            <Eye className="w-2.5 h-2.5 text-sky-400" />
            <span className="truncate">Zoya&apos;s Vision</span>
            <span className="text-[7px] px-1 py-0 bg-sky-500/20 text-sky-300 rounded font-mono uppercase">
              Live
            </span>
          </span>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center gap-0.5 text-neutral-400">
          {/* Quick Size Toggle Button */}
          {!isFullscreen && (
            <button
              onClick={cycleSize}
              className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title={`Current size: ${camSize}. Click to cycle: micro / compact / standard`}
            >
              {camSize === "micro" ? "XS" : camSize === "compact" ? "S" : "M"}
            </button>
          )}

          {/* Minimize into badge */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-0.5 rounded hover:text-white hover:bg-neutral-800 transition-colors"
            title="Minimize to tiny floating badge"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>

          {/* Toggle Expand Details */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:text-white hover:bg-neutral-800 transition-colors"
            title={isExpanded ? "Collapse Details" : "Expand Details & Reading"}
          >
            {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => onChangePosition(isFullscreen ? "top-right" : "fullscreen")}
            className="p-0.5 rounded hover:text-white hover:bg-neutral-800 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-2.5 h-2.5" /> : <Maximize2 className="w-2.5 h-2.5" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-0.5 rounded hover:text-white hover:bg-neutral-800 transition-colors"
            title="Close Webcam"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Mini Video Feed */}
      <div className="relative bg-black aspect-video w-full overflow-hidden shrink-0 group">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform ${
            isMirrored ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Scanning laser animation */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_8px_#38bdf8] animate-[bounce_1.2s_infinite]" />
            <div className="absolute inset-0 bg-sky-500/10 flex items-center justify-center">
              <span className="text-[8px] font-mono text-sky-300 font-bold bg-black/80 px-1 py-0.2 rounded-full border border-sky-500/40">
                Scanning Body &amp; Clothes
              </span>
            </div>
          </div>
        )}

        {/* Offline Overlay */}
        {!streamActive && (
          <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-1.5 text-center z-10">
            <VideoOff className="w-3.5 h-3.5 text-neutral-500 mb-0.5" />
            <p className="text-[9px] text-neutral-400 mb-1 leading-tight">{streamError || "Camera offline"}</p>
            <div className="flex gap-1">
              <button
                onClick={() => startCamera()}
                className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-semibold flex items-center gap-0.5"
              >
                <RefreshCw className="w-2 h-2" />
                <span>Retry</span>
              </button>
              <button
                onClick={onOpenPermissionGuide}
                className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[9px]"
              >
                Perms
              </button>
            </div>
          </div>
        )}

        {/* Mini In-Video Overlay Buttons (visible on hover) */}
        {streamActive && (
          <div className="absolute bottom-0.5 left-0.5 right-0.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="flex items-center gap-0.5 bg-black/75 backdrop-blur-sm rounded p-0.5 border border-white/10">
              <button
                onClick={togglePause}
                className="p-0.5 rounded text-white/80 hover:text-white"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Video className="w-2 h-2" /> : <VideoOff className="w-2 h-2" />}
              </button>
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className={`p-0.5 rounded ${isMirrored ? "text-sky-400" : "text-white/80"}`}
                title="Mirror"
              >
                <FlipHorizontal className="w-2 h-2" />
              </button>
            </div>

            <button
              onClick={() => performAIEyeScan("all")}
              disabled={isScanning}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold text-[8px] shadow"
              title="Scan Live"
            >
              <Sparkles className="w-2 h-2" />
              <span>Scan</span>
            </button>
          </div>
        )}
      </div>

      {/* Mini Bottom Strip: Compact Attire & People Status */}
      <div className="px-1.5 py-1 bg-neutral-950/90 border-t border-neutral-800/80 flex items-center justify-between gap-1 text-[9px]">
        <div className="truncate flex items-center gap-1">
          {lastObservation?.clothing?.topColor ? (
            <span className="text-sky-300 font-medium flex items-center gap-0.5 truncate">
              <Shirt className="w-2.5 h-2.5 text-sky-400 shrink-0" />
              <span className="truncate">{lastObservation.clothing.topColor}</span>
              {lastObservation.peopleCount > 1 && (
                <span className="px-1 bg-amber-500/20 text-amber-300 rounded text-[7px] font-bold">
                  {lastObservation.peopleCount} ppl
                </span>
              )}
            </span>
          ) : lastObservation?.personality?.vibeTitle ? (
            <span className="text-emerald-300 font-semibold truncate">
              ✦ {lastObservation.personality.vibeTitle}
            </span>
          ) : lastObservation?.recognizedActivityType === "drinking_water" ? (
            <span className="text-cyan-400 font-semibold flex items-center gap-0.5 truncate">
              <Droplets className="w-2.5 h-2.5" /> Water
            </span>
          ) : lastObservation?.recognizedActivityType === "taking_medication" ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5 truncate">
              <Pill className="w-2.5 h-2.5" /> Meds
            </span>
          ) : (
            <span className="text-neutral-400 truncate">Watching...</span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-neutral-400 hover:text-white shrink-0 font-medium text-[8px]"
        >
          {isExpanded ? "Less" : "Info"}
        </button>
      </div>

      {/* Optional Expanded Details Section (Opens smoothly when requested) */}
      {isExpanded && (
        <div className="flex flex-col border-t border-neutral-800 bg-neutral-900/95 max-h-64 overflow-y-auto p-2 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[8px] text-sky-300/80 bg-sky-950/40 border border-sky-800/40 rounded px-1.5 py-0.5">
            <span>✦ Live details shared to Zoya</span>
            <span className="text-neutral-400">Ask Zoya about your clothes or body</span>
          </div>

          {/* Subtabs Header */}
          <div className="flex border-b border-neutral-800 pb-1 gap-1 text-[9px]">
            <button
              onClick={() => setActiveTab("people_clothes")}
              className={`flex-1 py-1 rounded-md font-semibold flex items-center justify-center gap-0.5 ${
                activeTab === "people_clothes"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Shirt className="w-2.5 h-2.5" />
              <span>Clothes &amp; People</span>
            </button>
            <button
              onClick={() => setActiveTab("body_posture")}
              className={`flex-1 py-1 rounded-md font-semibold flex items-center justify-center gap-0.5 ${
                activeTab === "body_posture"
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Activity className="w-2.5 h-2.5" />
              <span>Whole Body</span>
            </button>
            <button
              onClick={() => setActiveTab("personality")}
              className={`flex-1 py-1 rounded-md font-semibold flex items-center justify-center gap-0.5 ${
                activeTab === "personality"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Vibe</span>
            </button>
          </div>

          {/* TAB 1: People & Clothes Recognition */}
          {activeTab === "people_clothes" && (
            <div className="space-y-1.5 text-[10px]">
              {/* People Count Badge */}
              <div className="p-1.5 rounded-lg bg-neutral-950/70 border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-neutral-400 flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3 text-sky-400" />
                    <span>People in View:</span>
                  </span>
                  <span className="font-bold text-sky-300 px-1.5 py-0.2 bg-sky-950 rounded border border-sky-800/40">
                    {lastObservation?.peopleCount || 1} Person(s)
                  </span>
                </div>

                {lastObservation?.people && lastObservation.people.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    {lastObservation.people.map((p, idx) => (
                      <div
                        key={idx}
                        className="text-[9px] p-1 rounded bg-neutral-900 border border-neutral-800 flex flex-col gap-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white capitalize">
                            {p.role.replace("_", " ")}
                          </span>
                          <span className="text-[8px] text-neutral-400">{p.position}</span>
                        </div>
                        <div className="text-sky-300 font-mono text-[8px]">
                          Attire: {p.clothingColors}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Primary User Clothing Breakdown */}
              <div className="p-1.5 rounded-lg bg-neutral-950/70 border border-sky-500/20 space-y-1">
                <span className="text-[9px] text-neutral-400 font-semibold block uppercase tracking-wider">
                  Primary Attire &amp; Colors:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[9px]">
                  <div className="p-1 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-400 block text-[8px]">Top / Shirt:</span>
                    <span className="font-bold text-sky-300">
                      {lastObservation?.clothing?.topColor || "Analyzing..."}
                    </span>
                  </div>
                  <div className="p-1 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-400 block text-[8px]">Bottom:</span>
                    <span className="font-bold text-slate-300">
                      {lastObservation?.clothing?.bottomColor || "Not visible"}
                    </span>
                  </div>
                </div>

                {lastObservation?.clothing?.overallDescription && (
                  <p className="text-[9px] text-neutral-300 italic pt-0.5">
                    &ldquo;{lastObservation.clothing.overallDescription}&rdquo;
                  </p>
                )}

                {lastObservation?.clothing?.accessories &&
                  lastObservation.clothing.accessories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {lastObservation.clothing.accessories.map((acc, idx) => (
                        <span
                          key={idx}
                          className="px-1 py-0.2 rounded bg-neutral-800 border border-neutral-700 text-sky-300 text-[8px]"
                        >
                          ✦ {acc}
                        </span>
                      ))}
                    </div>
                  )}
              </div>

              <button
                onClick={() => performAIEyeScan("all")}
                disabled={isScanning}
                className="w-full py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[9px] flex items-center justify-center gap-1"
              >
                <Shirt className="w-2.5 h-2.5" />
                <span>Scan Clothes &amp; People</span>
              </button>
            </div>
          )}

          {/* TAB 2: Whole Body & Posture */}
          {activeTab === "body_posture" && (
            <div className="space-y-1.5 text-[10px]">
              <div className="p-1.5 rounded-lg bg-neutral-950/70 border border-teal-500/20 space-y-1">
                <span className="text-[9px] text-neutral-400 block font-semibold uppercase tracking-wider">
                  Whole Body Analysis:
                </span>
                <div className="space-y-1 text-[9px]">
                  <div className="p-1 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-400 block text-[8px]">Posture:</span>
                    <span className="font-semibold text-white">
                      {lastObservation?.wholeBody?.posture || lastObservation?.bodyLanguage || "Upright sitting position"}
                    </span>
                  </div>

                  <div className="p-1 rounded bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-400 block text-[8px]">Hands &amp; Arms:</span>
                    <span className="text-teal-300">
                      {lastObservation?.wholeBody?.handsAndArms || "Resting naturally"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    <div className="p-1 rounded bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-400 block text-[8px]">Framed View:</span>
                      <span className="text-slate-300 capitalize">
                        {lastObservation?.wholeBody?.visiblePortion?.replace("_", " ") || "Upper body"}
                      </span>
                    </div>
                    <div className="p-1 rounded bg-neutral-900 border border-neutral-800">
                      <span className="text-neutral-400 block text-[8px]">Energy Level:</span>
                      <span className="text-emerald-300">
                        {lastObservation?.wholeBody?.energyAndVibe || "Calm & steady"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => performAIEyeScan("activity")}
                disabled={isScanning}
                className="w-full py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[9px] flex items-center justify-center gap-1"
              >
                <Activity className="w-2.5 h-2.5" />
                <span>Analyze Body Posture</span>
              </button>
            </div>
          )}

          {/* TAB 3: Personality & Vibe */}
          {activeTab === "personality" && (
            <div className="space-y-1.5 text-[10px]">
              {lastObservation?.personality ? (
                <>
                  <div className="p-1.5 rounded-lg bg-neutral-950/70 border border-purple-500/20 space-y-0.5">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-bold text-purple-300">
                        {lastObservation.personality.vibeTitle}
                      </span>
                      <span className="text-neutral-400">
                        {lastObservation.personality.auraColor} Aura
                      </span>
                    </div>
                    <p className="text-[9px] text-neutral-300 italic font-serif">
                      &ldquo;{lastObservation.personality.wholePersonAnalysis}&rdquo;
                    </p>
                  </div>

                  {lastObservation.personality.traits && (
                    <div className="flex flex-wrap gap-1">
                      {lastObservation.personality.traits.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-1 py-0.2 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[8px]"
                        >
                          ✦ {t}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-1 text-neutral-400 text-[9px]">
                  <p>Click &ldquo;Scan&rdquo; on the camera to read whole persona!</p>
                </div>
              )}

              <button
                onClick={() => performAIEyeScan("personality")}
                disabled={isScanning}
                className="w-full py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[9px] flex items-center justify-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Analyze Persona &amp; Vibe</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
