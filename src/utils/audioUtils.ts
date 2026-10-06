// Global audio context singleton with auto-unlock
let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContextClass({ sampleRate: 24000 });
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// User-gesture unlocker
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

export async function playPCM(base64Data: string): Promise<void> {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) {
      console.warn("AudioContext not supported");
      return;
    }

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check if the payload is a standard WAV file (starts with "RIFF")
    const isWav =
      len > 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;

    let audioBuffer: AudioBuffer;

    if (isWav) {
      try {
        audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
      } catch {
        // Fallback: skip 44-byte WAV header and treat as 24kHz mono 16-bit
        const pcmBytes = bytes.slice(44);
        const alignedLen = Math.floor(pcmBytes.length / 2) * 2;
        const int16 = new Int16Array(pcmBytes.buffer, pcmBytes.byteOffset, alignedLen / 2);
        audioBuffer = audioCtx.createBuffer(1, int16.length, 24000);
        const channel = audioBuffer.getChannelData(0);
        for (let i = 0; i < int16.length; i++) {
          channel[i] = int16[i] / 32768.0;
        }
      }
    } else {
      // Raw L16 PCM (24kHz mono)
      const alignedLen = Math.floor(len / 2) * 2;
      const buffer = new Int16Array(bytes.buffer, bytes.byteOffset, alignedLen / 2);
      audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();

    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  } catch (error) {
    console.error("Error playing audio via WebAudio:", error);
  }
}

// Reliable Web Speech Synthesis fallback for vocal output
export function speakTextFallback(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    // Clean text of technical tokens or status tags if any
    const cleanText = text.replace(/\[.*?\]/g, "").trim();
    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

    // Try finding an Indian English or sweet female voice
    const voices = window.speechSynthesis.getVoices();
    const hindiOrIndianVoice = voices.find(
      (v) =>
        v.lang.includes("en-IN") ||
        v.lang.includes("hi-IN") ||
        v.name.toLowerCase().includes("india") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("google")
    );
    if (hindiOrIndianVoice) {
      utterance.voice = hindiOrIndianVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.error("Speech synthesis fallback failed:", e);
    return false;
  }
}

// Gentle pleasant chime for medication alerts
export function playMedicationChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audioCtx = getAudioContext();
      if (!audioCtx) {
        resolve();
        return;
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      const now = audioCtx.currentTime;
      // Dual-tone melodic bell chime (E5 -> G#5 -> B5)
      const notes = [659.25, 830.61, 987.77];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.18 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.9);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.95);
      });

      setTimeout(resolve, 800);
    } catch (e) {
      console.warn("Chime playback error:", e);
      resolve();
    }
  });
}
