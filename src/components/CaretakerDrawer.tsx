import React, { useState } from "react";
import {
  X,
  Pill,
  Droplets,
  Heart,
  Phone,
  User,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Save,
  Shield,
  Trash2,
  Activity,
  Smile,
  Frown,
  Meh,
  Zap,
  Bell,
  Volume2,
  Stethoscope,
  HeartPulse,
  BookOpen,
  Send,
  Loader2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  CaretakerState,
  Medication,
  CareProfile,
  WellnessMood,
  MedicalVitals,
} from "../types/caretaker";
import {
  evaluatePatientVitals,
  CLINICAL_REFERENCE_LIBRARY,
  getPersonalizedMedicalAdvice,
} from "../services/medicalAdviceService";

interface CaretakerDrawerProps {
  state: CaretakerState;
  onUpdateState: (newState: CaretakerState) => void;
  onTriggerSOS: (reason?: string) => void;
  onStartBreathing: () => void;
  onClose: () => void;
}

export default function CaretakerDrawer({
  state,
  onUpdateState,
  onTriggerSOS,
  onStartBreathing,
  onClose,
}: CaretakerDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "medications" | "medical_advice" | "wellness" | "profile" | "contacts"
  >("medications");

  // Medical Advice Drawer State
  const [adviceInput, setAdviceInput] = useState("");
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [adviceResult, setAdviceResult] = useState<string | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string>("guide-bp");

  const evaluatedVitals = evaluatePatientVitals(state.vitals);

  const handleDrawerAdviceSubmit = async (queryText: string) => {
    if (!queryText.trim() || isGeneratingAdvice) return;
    setIsGeneratingAdvice(true);
    setAdviceResult(null);
    try {
      const res = await getPersonalizedMedicalAdvice(queryText.trim(), {
        profile: state.profile,
        medications: state.medications,
        vitals: state.vitals,
        medicalRecords: state.medicalRecords,
      });
      setAdviceResult(res);
    } catch {
      setAdviceResult("Medical advice could not be retrieved. Please consult attending physician Dr. Priya Varma.");
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  // New medication form state
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedTime, setNewMedTime] = useState("08:00 AM");
  const [newMedPeriod, setNewMedPeriod] = useState<
    "morning" | "afternoon" | "evening" | "night"
  >("morning");
  const [newMedNotes, setNewMedNotes] = useState("");

  // Profile edit state
  const [profileForm, setProfileForm] = useState<CareProfile>(state.profile);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Toggle medicine taken
  const toggleMedTaken = (id: string) => {
    const updated = state.medications.map((m) =>
      m.id === id ? { ...m, takenToday: !m.takenToday } : m
    );
    onUpdateState({ ...state, medications: updated });
  };

  const deleteMed = (id: string) => {
    const updated = state.medications.filter((m) => m.id !== id);
    onUpdateState({ ...state, medications: updated });
  };

  const handleAddMedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim()) return;

    const newMed: Medication = {
      id: "med-" + Date.now(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || "1 dose",
      time: newMedTime.trim() || "12:00 PM",
      period: newMedPeriod,
      takenToday: false,
      notes: newMedNotes.trim(),
    };

    onUpdateState({
      ...state,
      medications: [...state.medications, newMed],
    });

    setNewMedName("");
    setNewMedDosage("");
    setNewMedNotes("");
    setShowAddMed(false);
  };

  const adjustWater = (delta: number) => {
    const updatedGlasses = Math.max(
      0,
      Math.min(16, (state.waterGlasses || 0) + delta)
    );
    onUpdateState({ ...state, waterGlasses: updatedGlasses });
  };

  const logMood = (mood: WellnessMood, notes?: string) => {
    const newEntry = {
      timestamp: new Date().toISOString(),
      mood,
      notes: notes || `Logged feeling ${mood}`,
    };
    onUpdateState({
      ...state,
      wellnessLogs: [newEntry, ...state.wellnessLogs].slice(0, 30),
    });
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateState({ ...state, profile: profileForm });
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2500);
  };

  const completedMeds = state.medications.filter((m) => m.takenToday).length;
  const totalMeds = state.medications.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-full bg-[#0a0f12] text-white border-l border-emerald-500/20 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide">
                  Caretaker Guardian Hub
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  Active
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Care for {state.profile.recipientName || "Nitin"} (Age{" "}
                {state.profile.age || "68"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/70 px-4 gap-2 shrink-0 overflow-x-auto scrollbar-hide py-2">
          <button
            onClick={() => setActiveTab("medications")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === "medications"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>Medications ({completedMeds}/{totalMeds})</span>
          </button>

          <button
            onClick={() => setActiveTab("medical_advice")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === "medical_advice"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Medical Advice &amp; Vitals</span>
          </button>

          <button
            onClick={() => setActiveTab("wellness")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "wellness"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Hydration & Wellness</span>
          </button>

          <button
            onClick={() => setActiveTab("contacts")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "contacts"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Emergency Contacts</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Records</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: MEDICATIONS */}
          {activeTab === "medications" && (
            <div className="space-y-4">
              {/* Daily Progress summary */}
              <div className="bg-neutral-900/80 rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-mono tracking-wider text-emerald-400">
                    Today's Adherence
                  </span>
                  <div className="text-2xl font-bold mt-0.5">
                    {completedMeds} of {totalMeds} taken
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {completedMeds === totalMeds && totalMeds > 0
                      ? "🌟 All medicines for today are taken!"
                      : "Zoya periodically prompts when medicines are due."}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMed(!showAddMed)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medicine</span>
                </button>
              </div>

              {/* Recurring Medication Alert & Notification Settings */}
              <div className="bg-neutral-900/60 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide">
                        Scheduled Time Voice Reminders
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Zoya reminds by voice only when it is exact time for scheduled medicines, or when asked.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.reminderSettings?.enabled ?? true}
                      onChange={(e) =>
                        onUpdateState({
                          ...state,
                          reminderSettings: {
                            enabled: e.target.checked,
                            intervalMinutes:
                              state.reminderSettings?.intervalMinutes ?? 15,
                            audioPrompt:
                              state.reminderSettings?.audioPrompt ?? true,
                            soundChime:
                              state.reminderSettings?.soundChime ?? true,
                          },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {(state.reminderSettings?.enabled ?? true) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-neutral-800 text-xs">
                    {/* Interval selector */}
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        Prompt Interval
                      </label>
                      <select
                        value={state.reminderSettings?.intervalMinutes ?? 15}
                        onChange={(e) =>
                          onUpdateState({
                            ...state,
                            reminderSettings: {
                              enabled: true,
                              intervalMinutes: Number(e.target.value),
                              audioPrompt:
                                state.reminderSettings?.audioPrompt ?? true,
                              soundChime:
                                state.reminderSettings?.soundChime ?? true,
                            },
                          })
                        }
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-1.5 text-white text-xs outline-none focus:border-emerald-500"
                      >
                        <option value={1}>1 Minute (Fast Test)</option>
                        <option value={5}>Every 5 Minutes</option>
                        <option value={15}>Every 15 Minutes</option>
                        <option value={30}>Every 30 Minutes</option>
                        <option value={60}>Every 1 Hour</option>
                      </select>
                    </div>

                    {/* Voice audio toggle */}
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        Voice Announcement
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateState({
                            ...state,
                            reminderSettings: {
                              enabled: true,
                              intervalMinutes:
                                state.reminderSettings?.intervalMinutes ?? 15,
                              audioPrompt: !(
                                state.reminderSettings?.audioPrompt ?? true
                              ),
                              soundChime:
                                state.reminderSettings?.soundChime ?? true,
                            },
                          })
                        }
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          state.reminderSettings?.audioPrompt ?? true
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-neutral-800 text-neutral-400 border-neutral-700"
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>
                          {state.reminderSettings?.audioPrompt ?? true
                            ? "Voice ON"
                            : "Voice OFF"}
                        </span>
                      </button>
                    </div>

                    {/* Chime toggle */}
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        Medical Bell Chime
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateState({
                            ...state,
                            reminderSettings: {
                              enabled: true,
                              intervalMinutes:
                                state.reminderSettings?.intervalMinutes ?? 15,
                              audioPrompt:
                                state.reminderSettings?.audioPrompt ?? true,
                              soundChime: !(
                                state.reminderSettings?.soundChime ?? true
                              ),
                            },
                          })
                        }
                        className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          state.reminderSettings?.soundChime ?? true
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-neutral-800 text-neutral-400 border-neutral-700"
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>
                          {state.reminderSettings?.soundChime ?? true
                            ? "Chime ON"
                            : "Chime OFF"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Med Inline Form */}
              {showAddMed && (
                <form
                  onSubmit={handleAddMedSubmit}
                  className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-300">
                      Add Medication Schedule
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddMed(false)}
                      className="text-neutral-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-neutral-400 mb-1">
                        Medicine Name
                      </label>
                      <input
                        type="text"
                        value={newMedName}
                        onChange={(e) => setNewMedName(e.target.value)}
                        placeholder="e.g. Amlodipine (BP)"
                        required
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">
                        Dosage / Instructions
                      </label>
                      <input
                        type="text"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        placeholder="e.g. 5mg - 1 tablet"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Time</label>
                      <input
                        type="text"
                        value={newMedTime}
                        onChange={(e) => setNewMedTime(e.target.value)}
                        placeholder="08:00 AM"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Period</label>
                      <select
                        value={newMedPeriod}
                        onChange={(e: any) => setNewMedPeriod(e.target.value)}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                      >
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                        <option value="night">Night</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 text-xs">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newMedNotes}
                      onChange={(e) => setNewMedNotes(e.target.value)}
                      placeholder="e.g. After breakfast with warm water"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Medication
                    </button>
                  </div>
                </form>
              )}

              {/* Medication list */}
              <div className="space-y-2.5">
                {state.medications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">
                    No medications listed. Click "Add Medicine" to create a schedule.
                  </div>
                ) : (
                  state.medications.map((med) => (
                    <div
                      key={med.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        med.takenToday
                          ? "bg-emerald-950/30 border-emerald-500/30 opacity-80"
                          : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleMedTaken(med.id)}
                          className="shrink-0 transition-transform active:scale-90"
                          title={
                            med.takenToday ? "Mark as Pending" : "Mark as Taken"
                          }
                        >
                          {med.takenToday ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <Circle className="w-6 h-6 text-neutral-500 hover:text-emerald-400" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                med.takenToday
                                  ? "line-through text-neutral-400"
                                  : "text-white"
                              }`}
                            >
                              {med.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300">
                              {med.time}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {med.dosage}
                            {med.notes ? ` • ${med.notes}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleMedTaken(med.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                            med.takenToday
                              ? "bg-neutral-800 text-neutral-400 hover:text-white"
                              : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
                          }`}
                        >
                          {med.takenToday ? "Undo" : "Mark Taken"}
                        </button>
                        <button
                          onClick={() => deleteMed(med.id)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                          title="Delete medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: MEDICAL ADVICE & CLINICAL VITALS */}
          {activeTab === "medical_advice" && (
            <div className="space-y-4">
              {/* Allergy Banner */}
              <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3 flex items-center justify-between text-xs text-red-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Documented Drug Allergy:</strong> Penicillin &amp; Amoxicillin (Severe)
                  </span>
                </div>
                <a
                  href={`tel:${state.profile.doctorPhone}`}
                  className="text-red-300 hover:text-white underline font-bold shrink-0 ml-2"
                >
                  Dr. Priya Varma
                </a>
              </div>

              {/* Consultation Input */}
              <div className="bg-neutral-900/90 rounded-2xl p-4 border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Personalized Clinical Advice Consultation
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Ask Zoya any medical query regarding BP, sugar, headaches, or drug interactions:
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDrawerAdviceSubmit(adviceInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={adviceInput}
                    onChange={(e) => setAdviceInput(e.target.value)}
                    placeholder="e.g. Can I take paracetamol with Amlodipine?, What if sugar drops?"
                    className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={!adviceInput.trim() || isGeneratingAdvice}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isGeneratingAdvice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Ask</span>
                  </button>
                </form>

                {adviceResult && (
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-cyan-500/40 text-xs text-neutral-200 whitespace-pre-line leading-relaxed">
                    <strong className="text-cyan-300 block mb-1">Zoya Clinical Advice:</strong>
                    {adviceResult}
                  </div>
                )}
              </div>

              {/* Patient Vitals Overview */}
              <div className="bg-neutral-900/90 rounded-2xl p-4 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-teal-400" />
                    <span>Current Patient Vitals</span>
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-400">
                    {state.vitals?.lastUpdated || "Recorded Today"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {evaluatedVitals.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-medium text-[11px]">{v.metric}</span>
                        <span className="font-bold font-mono text-emerald-400 text-xs">{v.value}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400">{v.statusLabel}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Senior Health Protocol Guides */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">
                  Standard Clinical Care Guides:
                </h4>
                {CLINICAL_REFERENCE_LIBRARY.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-white">
                      <span>{item.topic}</span>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">{item.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "wellness" && (
            <div className="space-y-6">
              {/* Hydration Tracker */}
              <div className="bg-gradient-to-br from-cyan-950/40 to-neutral-900 rounded-2xl p-5 border border-cyan-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Daily Hydration Tracker
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Target: {state.waterTarget} glasses (~2 Litres)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {state.waterGlasses}
                    </span>
                    <span className="text-neutral-400 text-xs">
                      /{state.waterTarget}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden p-0.5 border border-neutral-700">
                  <div
                    className="bg-gradient-to-r from-teal-400 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                    style={{
                      width: `${Math.min(
                        100,
                        ((state.waterGlasses || 0) / (state.waterTarget || 8)) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-neutral-400">
                    Voice command: "I drank water"
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustWater(-1)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
                    >
                      -1 Glass
                    </button>
                    <button
                      onClick={() => adjustWater(1)}
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1 Glass</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Wellness Mood Check */}
              <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>How are you feeling right now?</span>
                </h4>
                <p className="text-xs text-neutral-400">
                  Select your current physical & mental comfort level:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => logMood("energetic")}
                    className="p-3 rounded-xl bg-neutral-800/80 hover:bg-emerald-950/50 hover:border-emerald-500/50 border border-neutral-700/60 flex flex-col items-center gap-1.5 transition-all"
                  >
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-medium">Energetic</span>
                  </button>

                  <button
                    onClick={() => logMood("peaceful")}
                    className="p-3 rounded-xl bg-neutral-800/80 hover:bg-teal-950/50 hover:border-teal-500/50 border border-neutral-700/60 flex flex-col items-center gap-1.5 transition-all"
                  >
                    <Smile className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-medium">Peaceful</span>
                  </button>

                  <button
                    onClick={() => logMood("tired")}
                    className="p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 flex flex-col items-center gap-1.5 transition-all"
                  >
                    <Meh className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-medium">Tired</span>
                  </button>

                  <button
                    onClick={() => {
                      logMood("pain", "Reported physical discomfort/pain");
                    }}
                    className="p-3 rounded-xl bg-neutral-800/80 hover:bg-rose-950/50 hover:border-rose-500/50 border border-neutral-700/60 flex flex-col items-center gap-1.5 transition-all"
                  >
                    <Frown className="w-5 h-5 text-rose-400" />
                    <span className="text-xs font-medium text-rose-300">
                      In Pain / Dizzy
                    </span>
                  </button>
                </div>
              </div>

              {/* Guided Breath Quick Launcher */}
              <div className="bg-neutral-900 rounded-2xl p-4 border border-teal-500/20 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                    Mindful Respiration
                  </h5>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    1-Minute box breathing for stress & BP calming
                  </p>
                </div>
                <button
                  onClick={onStartBreathing}
                  className="px-3.5 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 border border-teal-500/40 text-xs font-semibold transition-colors"
                >
                  Start Breathing
                </button>
              </div>

              {/* Recent Wellness Logs */}
              {state.wellnessLogs.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Recent Wellness Logs
                  </h5>
                  <div className="space-y-1.5">
                    {state.wellnessLogs.slice(0, 4).map((entry, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs flex items-center justify-between text-neutral-300"
                      >
                        <span className="capitalize font-medium">
                          {entry.mood} - {entry.notes || "Check-in"}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTACTS & SOS */}
          {activeTab === "contacts" && (
            <div className="space-y-5">
              {/* Emergency SOS Quick Test */}
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-200">
                      Emergency Alert Trigger
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Sound siren & prepare instant WhatsApp/Call dispatch
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onTriggerSOS("Manual SOS button pressed")}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
                >
                  Test SOS
                </button>
              </div>

              {/* Primary Contact Card */}
              <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-rose-400">
                    Primary Emergency Contact
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {state.profile.relationship || "Family"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {state.profile.emergencyContactName || "Not Configured"}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      {state.profile.emergencyContactPhone || "No Phone"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${state.profile.emergencyContactPhone}`}
                      className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 transition-colors"
                      title="Call Contact"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Doctor Card */}
              <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-mono tracking-wider text-cyan-400">
                    Primary Doctor / Hospital
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    Cardiologist / Physician
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {state.profile.doctorName || "Not Configured"}
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                      {state.profile.doctorPhone || "No Phone"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${state.profile.doctorPhone}`}
                      className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 transition-colors"
                      title="Call Doctor"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* National Helpline */}
              <div className="bg-neutral-900/60 rounded-2xl p-4 border border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
                <div>
                  <span className="font-semibold block text-white">
                    National Emergency Helpline (India / Global)
                  </span>
                  <span className="text-neutral-400">
                    Direct ambulance and emergency response
                  </span>
                </div>
                <a
                  href="tel:112"
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-mono font-bold"
                >
                  Dial 112
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & MEDICAL RECORDS */}
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Care Recipient Medical Profile
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Zoya references this data during voice conversations & safety alerts.
                  </p>
                </div>
                {profileSavedMsg && (
                  <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                    ✓ Saved!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1">
                    Care Recipient Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.recipientName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        recipientName: e.target.value,
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Age</label>
                  <input
                    type="text"
                    value={profileForm.age}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, age: e.target.value })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={profileForm.bloodGroup}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        bloodGroup: e.target.value,
                      })
                    }
                    placeholder="e.g. B+, O+, AB-"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={profileForm.relationship}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        relationship: e.target.value,
                      })
                    }
                    placeholder="e.g. Father, Mother, Self"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">
                    Allergies & Sensitivities
                  </label>
                  <input
                    type="text"
                    value={profileForm.allergies}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        allergies: e.target.value,
                      })
                    }
                    placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">
                    Medical Conditions / Diagnostics
                  </label>
                  <textarea
                    rows={2}
                    value={profileForm.conditions}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        conditions: e.target.value,
                      })
                    }
                    placeholder="e.g. Hypertension, Pacemaker, Type 2 Diabetes"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-400 mb-1">
                    Home Address (For SOS Responders)
                  </label>
                  <input
                    type="text"
                    value={profileForm.homeAddress}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        homeAddress: e.target.value,
                      })
                    }
                    placeholder="Flat 402, Green Meadows..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.emergencyContactName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        emergencyContactName: e.target.value,
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="text"
                    value={profileForm.emergencyContactPhone}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        emergencyContactPhone: e.target.value,
                      })
                    }
                    placeholder="+91..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.doctorName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        doctorName: e.target.value,
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">
                    Doctor Phone
                  </label>
                  <input
                    type="text"
                    value={profileForm.doctorPhone}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        doctorPhone: e.target.value,
                      })
                    }
                    placeholder="+91..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Voice commands ready</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
}
