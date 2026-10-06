import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Camera,
  Mic,
  X,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

interface Props {
  onClose: () => void;
  permissionType?: "camera" | "microphone" | "both";
  onRequestPermissions?: () => Promise<void>;
}

export default function PermissionModal({
  onClose,
  permissionType = "both",
  onRequestPermissions,
}: Props) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleGrantPermission = async () => {
    setIsRequesting(true);
    setStatusMessage(null);

    try {
      if (onRequestPermissions) {
        await onRequestPermissions();
        onClose();
        return;
      }

      let camOk = false;
      let micOk = false;

      // Camera request
      if (permissionType === "camera" || permissionType === "both") {
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
          vStream.getTracks().forEach((t) => t.stop());
          camOk = true;
        } catch (e) {
          console.warn("Camera grant error:", e);
        }
      }

      // Mic request
      if (permissionType === "microphone" || permissionType === "both") {
        try {
          const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          aStream.getTracks().forEach((t) => t.stop());
          micOk = true;
        } catch (e) {
          console.warn("Mic grant error:", e);
        }
      }

      if (camOk || micOk) {
        setStatusMessage(
          `Permission granted! ${camOk ? "Webcam AI Eye ready." : ""} ${micOk ? "Microphone ready." : ""}`
        );
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setStatusMessage(
          "Permission was not granted by your browser. Click the Lock icon 🔒 beside your address bar to set Camera & Mic to 'Allow'."
        );
      }
    } catch (err: any) {
      console.warn("Permission error:", err);
      setStatusMessage(
        "Browser blocked the automatic prompt. Please click the Lock icon in your address bar to enable Camera & Mic."
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden text-neutral-100 my-8"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Camera className="w-7 h-7" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
            <Mic className="w-7 h-7" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
          Enable Webcam &amp; Voice Access
        </h2>
        <p className="text-neutral-400 text-xs sm:text-sm mb-5 max-w-md leading-relaxed">
          Allow camera and microphone access so Zoya&apos;s AI Eye can observe your live activities, read your whole personality &amp; vibe, and talk with you.
        </p>

        {/* Primary Prompt Button */}
        <button
          onClick={handleGrantPermission}
          disabled={isRequesting}
          className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-sm sm:text-base rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 mb-5 active:scale-98 disabled:opacity-50"
        >
          {isRequesting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Prompting Browser...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Grant Camera &amp; Mic Access Now</span>
            </>
          )}
        </button>

        {statusMessage && (
          <div className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 mb-4 text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Instructions Box */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 text-left w-full mb-5 text-xs text-neutral-300 space-y-2.5">
          <p className="font-semibold text-white flex items-center gap-1.5 text-xs">
            Steps to Allow in Browser:
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 leading-normal text-neutral-400">
            <li>
              Look at your browser&apos;s address / URL bar at the top of the screen.
            </li>
            <li>
              Click the <strong>Lock icon</strong> (or site permissions slider icon) right next to the URL.
            </li>
            <li>
              Set both <strong>Camera</strong> and <strong>Microphone</strong> to <strong>&ldquo;Allow&rdquo;</strong>.
            </li>
            <li>
              Click <strong>&ldquo;Reload &amp; Apply&rdquo;</strong> below if required.
            </li>
          </ol>
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row w-full gap-2.5">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload &amp; Apply</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-white font-medium rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
