import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { AppMode, CareProfile, Medication, MedicalVitals, MedicalRecordEntry, VisionObservation } from "../types/caretaker";
import { getCaretakerSystemInstruction, getCompanionSystemInstruction } from "./geminiService";

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  // Audio playback state
  private playbackContext: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;
  public isMuted: boolean = false;

  public mode: AppMode = "companion";
  public caretakerContext?: {
    profile?: CareProfile;
    medications?: Medication[];
    waterGlasses?: number;
    waterTarget?: number;
    vitals?: MedicalVitals;
    medicalRecords?: MedicalRecordEntry[];
    liveVision?: VisionObservation | null;
  };

  public onStateChange: (state: "idle" | "listening" | "processing" | "speaking") => void = () => {};
  public onMessage: (sender: "user" | "zoya", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};
  public onCaretakerAction: (action: string, payload?: any) => void = () => {};

  constructor(
    mode: AppMode = "companion",
    caretakerContext?: {
      profile?: CareProfile;
      medications?: Medication[];
      waterGlasses?: number;
      waterTarget?: number;
      vitals?: MedicalVitals;
      medicalRecords?: MedicalRecordEntry[];
      liveVision?: VisionObservation | null;
    }
  ) {
    this.mode = mode;
    this.caretakerContext = caretakerContext;
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async start() {
    try {
      this.onStateChange("processing");

      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      if (this.playbackContext.state === "suspended") {
        await this.playbackContext.resume();
      }
      this.nextPlayTime = this.playbackContext.currentTime;

      // Get Microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.sessionPromise) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }

        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Data = btoa(binary);

        this.sessionPromise
          .then((session) => {
            session.sendRealtimeInput({
              audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
            });
          })
          .catch((err) => console.error("Error sending audio", err));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      const systemInstruction =
        this.mode === "caretaker"
          ? getCaretakerSystemInstruction(
              this.caretakerContext?.profile,
              this.caretakerContext?.medications,
              this.caretakerContext?.waterGlasses,
              this.caretakerContext?.waterTarget,
              this.caretakerContext?.vitals,
              this.caretakerContext?.medicalRecords,
              this.caretakerContext?.liveVision
            )
          : getCompanionSystemInstruction(this.caretakerContext?.liveVision);

      const functionDeclarations: any[] = [
        {
          name: "executeBrowserAction",
          description:
            "Open a website, search on Google, or search/play video/music (YouTube, Spotify, WhatsApp). Call this when user requests search, media, or website.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              actionType: {
                type: Type.STRING,
                description: "Type of action: 'google', 'youtube', 'spotify', 'whatsapp', 'open'",
              },
              query: {
                type: Type.STRING,
                description: "The search query, website name, or message content.",
              },
              target: {
                type: Type.STRING,
                description: "The target phone number for WhatsApp, if applicable.",
              },
            },
            required: ["actionType", "query"],
          },
        },
      ];

      // Add Caretaker-specific tool calls if in Caretaker Mode
      if (this.mode === "caretaker") {
        functionDeclarations.push(
          {
            name: "triggerEmergencyAlert",
            description:
              "Trigger immediate emergency SOS alarm and alert emergency contacts/doctor when the user reports falling, severe chest pain, inability to breathe, or calls for help.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                reason: {
                  type: Type.STRING,
                  description: "Reason or symptoms described by the user.",
                },
              },
              required: ["reason"],
            },
          },
          {
            name: "logMedicationTaken",
            description:
              "Log that the user has taken their scheduled medicine or dose.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                medicationName: {
                  type: Type.STRING,
                  description: "Name of the medication taken, or 'all_current'.",
                },
              },
            },
          },
          {
            name: "logWaterIntake",
            description:
              "Log that the user drank a glass or quantity of water.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                glasses: {
                  type: Type.NUMBER,
                  description: "Number of glasses drank (usually 1).",
                },
              },
            },
          },
          {
            name: "startBreathingSession",
            description:
              "Start guided mindful breathing exercise for the user to reduce anxiety, stress, or high pulse.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                durationSeconds: {
                  type: Type.NUMBER,
                  description: "Duration in seconds (e.g. 60).",
                },
              },
            },
          }
        );
      }

      // Connect to Live API using gemini-3.8-live and Kore voice
      this.sessionPromise = this.ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations }],
        },
        callbacks: {
          onopen: () => {
            console.log("Live API Connected");
            this.onStateChange("listening");
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio & Text Output from model parts
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                this.onStateChange("speaking");
                this.playAudioChunk(part.inlineData.data);
              }
              if (part.text) {
                this.onMessage("zoya", part.text);
              }
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              this.stopPlayback();
              this.onStateChange("listening");
            }

            // Handle Function Calls
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
              for (const call of functionCalls) {
                let responsePayload = { result: "Success" };

                if (call.name === "executeBrowserAction") {
                  const args = call.args as any;
                  let url = "";
                  if (args.actionType === "google") {
                    url = `https://www.google.com/search?q=${encodeURIComponent(
                      args.query
                    )}`;
                  } else if (args.actionType === "youtube") {
                    url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      args.query
                    )}`;
                  } else if (args.actionType === "spotify") {
                    url = `https://open.spotify.com/search/${encodeURIComponent(args.query)}`;
                  } else if (args.actionType === "whatsapp") {
                    url = `https://web.whatsapp.com/send?phone=${
                      args.target || ""
                    }&text=${encodeURIComponent(args.query)}`;
                  } else {
                    let website = args.query.replace(/\s+/g, "");
                    if (!website.includes(".")) website += ".com";
                    url = `https://www.${website}`;
                  }

                  this.onCommand(url);
                  responsePayload = { result: "Action executed successfully in browser." };
                } else if (call.name === "triggerEmergencyAlert") {
                  const args = call.args as any;
                  this.onCaretakerAction("emergency", args);
                  responsePayload = {
                    result:
                      "Emergency protocol activated! High-priority alert triggered on screen.",
                  };
                } else if (call.name === "logMedicationTaken") {
                  const args = call.args as any;
                  this.onCaretakerAction("log_medication", args);
                  responsePayload = { result: "Medication successfully logged as taken." };
                } else if (call.name === "logWaterIntake") {
                  const args = call.args as any;
                  this.onCaretakerAction("log_water", args);
                  responsePayload = { result: "Water logged successfully." };
                } else if (call.name === "startBreathingSession") {
                  this.onCaretakerAction("start_breathing");
                  responsePayload = { result: "Guided breathing exercise initiated." };
                }

                // Send tool response back to Gemini Live
                this.sessionPromise?.then((session) => {
                  session.sendToolResponse({
                    functionResponses: [
                      {
                        name: call.name,
                        id: call.id,
                        response: responsePayload,
                      },
                    ],
                  });
                });
              }
            }
          },
          onclose: () => {
            console.log("Live API Closed");
            this.stop();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            this.stop();
          },
        },
      });
    } catch (error) {
      console.error("Failed to start Live Session:", error);
      this.stop();
      throw error;
    }
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const alignedLen = Math.floor(len / 2) * 2;
      const buffer = new Int16Array(bytes.buffer, bytes.byteOffset, alignedLen / 2);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }

      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackContext.destination);

      const currentTime = this.playbackContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;

      source.onended = () => {
        if (
          this.playbackContext &&
          this.playbackContext.currentTime >= this.nextPlayTime - 0.1
        ) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      };
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  private stopPlayback() {
    if (this.playbackContext) {
      this.playbackContext.close();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
      this.nextPlayTime = this.playbackContext.currentTime;
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopPlayback();

    if (this.sessionPromise) {
      this.sessionPromise.then((session) => session.close()).catch(() => {});
      this.sessionPromise = null;
    }

    this.onStateChange("idle");
  }

  sendText(text: string) {
    if (this.sessionPromise) {
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ text });
      });
    }
  }

  updateVision(obs: VisionObservation) {
    if (this.caretakerContext) {
      this.caretakerContext.liveVision = obs;
    }
    if (this.sessionPromise) {
      const objs = obs.personality?.objectsObserved?.join(", ") || "none";
      const clothes = obs.clothing
        ? `${obs.clothing.topColor} top, ${obs.clothing.bottomColor || 'bottom'} (${obs.clothing.overallDescription})`
        : "casual";
      const people = obs.peopleCount ? `${obs.peopleCount} person(s)` : "1 person";
      const posture = obs.wholeBody?.posture || obs.bodyLanguage || "sitting";
      const hands = obs.wholeBody?.handsAndArms || "normal";
      const infoText = `[Zoya Optical Vision Update: People: ${people} | Clothes: ${clothes} | Posture: ${posture} | Hands: ${hands} | Activity: ${obs.activity} (${obs.recognizedActivityType}) | Expression: ${obs.personality?.expression || "attentive"} | Objects: ${objs} | Vibe: "${obs.personality?.vibeTitle || "calm"}"]`;
      this.sessionPromise
        .then((session) => {
          session.sendRealtimeInput({ text: infoText });
        })
        .catch((err) => console.debug("Error feeding vision to Live session:", err));
    }
  }
}
