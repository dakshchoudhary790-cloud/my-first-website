import React, { useState } from "react";
import {
  Stethoscope,
  X,
  AlertTriangle,
  HeartPulse,
  Activity,
  Pill,
  ShieldCheck,
  Send,
  Loader2,
  Sparkles,
  Phone,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Scale,
  Thermometer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  CareProfile,
  Medication,
  MedicalVitals,
  MedicalRecordEntry,
} from "../types/caretaker";
import {
  evaluatePatientVitals,
  CLINICAL_REFERENCE_LIBRARY,
  STANDARD_VITALS_RANGES,
  checkDrugInteractions,
  getPersonalizedMedicalAdvice,
  VitalsAssessment,
  DrugInteractionResult,
} from "../services/medicalAdviceService";

interface MedicalAdviceModalProps {
  profile: CareProfile;
  medications: Medication[];
  vitals?: MedicalVitals;
  medicalRecords?: MedicalRecordEntry[];
  initialQuery?: string;
  onUpdateVitals?: (newVitals: MedicalVitals) => void;
  onClose: () => void;
}

export default function MedicalAdviceModal({
  profile,
  medications,
  vitals,
  medicalRecords,
  initialQuery = "",
  onUpdateVitals,
  onClose,
}: MedicalAdviceModalProps) {
  const [activeTab, setActiveTab] = useState<
    "consult" | "library" | "vitals" | "drug_checker" | "records"
  >("consult");
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adviceResponse, setAdviceResponse] = useState<string | null>(null);

  // Library search & filter
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<string>("all");
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("guide-bp");

  // Drug checker state
  const [drugA, setDrugA] = useState("Amlodipine 5mg");
  const [drugB, setDrugB] = useState("Ibuprofen (Painkiller)");
  const [interactionResult, setInteractionResult] = useState<DrugInteractionResult | null>(() =>
    checkDrugInteractions("Amlodipine", "Ibuprofen")
  );

  // Vitals edit form
  const [showEditVitals, setShowEditVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState<MedicalVitals>(vitals || {});

  const evaluatedVitals = evaluatePatientVitals(vitals);

  const handleConsultSubmit = async (queryText: string) => {
    if (!queryText.trim() || isGenerating) return;
    setIsGenerating(true);
    setAdviceResponse(null);

    try {
      const response = await getPersonalizedMedicalAdvice(queryText.trim(), {
        profile,
        medications,
        vitals,
        medicalRecords,
      });
      setAdviceResponse(response);
    } catch (err) {
      console.error("Advice query error:", err);
      setAdviceResponse(
        "Sir, clinical guidance generate karne me error aaya. Kripya apne physician Dr. Priya Varma (+919812345678) se consult karein."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateVitals) {
      onUpdateVitals({
        ...vitalsForm,
        lastUpdated: `Today at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      });
    }
    setShowEditVitals(false);
  };

  const runDrugCheck = () => {
    if (!drugA.trim() || !drugB.trim()) return;
    const result = checkDrugInteractions(drugA, drugB);
    setInteractionResult(result);
  };

  // Filtered library items
  const filteredLibrary = CLINICAL_REFERENCE_LIBRARY.filter((item) => {
    const matchesSearch =
      librarySearch === "" ||
      item.topic.toLowerCase().includes(librarySearch.toLowerCase()) ||
      item.summary.toLowerCase().includes(librarySearch.toLowerCase()) ||
      item.fullGuidance.toLowerCase().includes(librarySearch.toLowerCase());

    const matchesCategory =
      libraryCategory === "all" || item.category === libraryCategory;

    return matchesSearch && matchesCategory;
  });

  const quickConsultPrompts = [
    "What should I do if my BP is 145/95?",
    "Can I take Paracetamol for headache with Amlodipine?",
    "I feel dizzy when standing up from bed",
    "What are safe snacks for Type 2 Diabetes?",
    "Why must I strictly avoid Penicillin antibiotics?",
    "What is the 15-15 rule for low blood sugar?",
    "What are safe home remedies for joint pain?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-emerald-500/30 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col h-[90vh] max-h-[850px] text-neutral-100">
        {/* Header Bar */}
        <div className="bg-neutral-950 px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Medical Advice &amp; Clinical Knowledge Hub
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/40 font-semibold">
                  Evidence-Based
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Patient: <strong className="text-white">{profile.recipientName}</strong> (Age {profile.age}, Blood: {profile.bloodGroup}) • Physician: Dr. Priya Varma
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Critical Medical Alert Strip */}
        <div className="bg-red-950/40 border-b border-red-500/30 px-5 py-2 flex items-center justify-between text-xs text-red-200 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">
              <strong>Allergy Alert:</strong> Severe Penicillin / Amoxicillin • <strong>Conditions:</strong> {profile.conditions}
            </span>
          </div>
          <a
            href={`tel:${profile.doctorPhone}`}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-red-300 hover:text-white underline ml-2"
          >
            <Phone className="w-3 h-3" />
            <span>Call Doctor</span>
          </a>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/80 px-4 gap-1.5 shrink-0 py-2 overflow-x-auto scrollbar-hide text-xs">
          <button
            onClick={() => setActiveTab("consult")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === "consult"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Doctor Consult</span>
          </button>

          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === "library"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Medical Info Library ({CLINICAL_REFERENCE_LIBRARY.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("vitals")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === "vitals"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
            <span>Vitals Standards &amp; Log</span>
          </button>

          <button
            onClick={() => setActiveTab("drug_checker")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === "drug_checker"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-purple-400" />
            <span>Drug Safety Checker</span>
          </button>

          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
              activeTab === "records"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Clinical Records</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* TAB 1: AI MEDICAL ADVICE & SYMPTOM CONSULT */}
          {activeTab === "consult" && (
            <div className="space-y-4">
              {/* Question Input Card */}
              <div className="bg-neutral-950/70 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Ask Zoya for Medical &amp; Clinical Guidance</h3>
                </div>
                <p className="text-neutral-400 text-xs">
                  Ask about your symptoms, medications, interactions, or blood pressure/sugar readings. Guidance is individualized to {profile.recipientName}&apos;s medical profile.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConsultSubmit(queryInput);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder="e.g. 'Can I take paracetamol for headache?', 'What to do if BP is 145/95?'..."
                    className="flex-1 bg-neutral-900 border border-neutral-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!queryInput.trim() || isGenerating}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Get Advice</span>
                  </button>
                </form>

                {/* Quick query chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                    Frequently Asked Clinical Questions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {quickConsultPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQueryInput(p);
                          handleConsultSubmit(p);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] text-neutral-300 hover:text-white transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advice Output Card */}
              {isGenerating && (
                <div className="p-8 text-center space-y-3 bg-neutral-950/40 rounded-2xl border border-neutral-800">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs text-neutral-300 font-medium">
                    Analyzing clinical records, medications, and vitals for {profile.recipientName}...
                  </p>
                </div>
              )}

              {adviceResponse && !isGenerating && (
                <div className="p-5 rounded-2xl bg-neutral-950 border border-emerald-500/40 space-y-3 text-xs shadow-lg">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Zoya&apos;s Personalized Clinical Guidance</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Grounded in Amlodipine, Metformin &amp; Allergy Profile
                    </span>
                  </div>

                  <div className="text-neutral-200 leading-relaxed space-y-2 whitespace-pre-line text-xs font-sans">
                    {adviceResponse}
                  </div>

                  <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Attending Physician: {profile.doctorName} ({profile.doctorPhone})</span>
                    <a href={`tel:${profile.doctorPhone}`} className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>Call Doctor</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SEARCHABLE MEDICAL INFO LIBRARY */}
          {activeTab === "library" && (
            <div className="space-y-3">
              {/* Search & Category Filter */}
              <div className="bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Search medical conditions, symptoms, drugs, first aid (e.g. 'BP', 'sugar', 'stroke', 'burn')..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {[
                    { id: "all", label: "All Topics" },
                    { id: "vitals", label: "Vitals & BP" },
                    { id: "medication_safety", label: "Drug Safety" },
                    { id: "emergency", label: "Emergency Triage" },
                    { id: "first_aid", label: "First Aid & Falls" },
                    { id: "diet_nutrition", label: "Home Care & Diet" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setLibraryCategory(c.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                        libraryCategory === c.id
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Protocol Accordion Items */}
              <div className="space-y-2.5">
                {filteredLibrary.length === 0 ? (
                  <div className="text-center py-8 text-neutral-400 bg-neutral-950/40 rounded-2xl border border-neutral-800">
                    <BookOpen className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                    <p>No medical topics matching &ldquo;{librarySearch}&rdquo;</p>
                  </div>
                ) : (
                  filteredLibrary.map((item) => (
                    <div
                      key={item.id}
                      className="bg-neutral-950/80 border border-neutral-800 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() =>
                          setSelectedLibraryId(selectedLibraryId === item.id ? "" : item.id)
                        }
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-900/60"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{item.topic}</h4>
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                              {item.category.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-1">{item.summary}</p>
                        </div>
                        {selectedLibraryId === item.id ? (
                          <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0 ml-2" />
                        )}
                      </button>

                      {selectedLibraryId === item.id && (
                        <div className="p-4 pt-0 border-t border-neutral-800/80 space-y-3 text-xs bg-neutral-950">
                          <p className="text-neutral-300 leading-relaxed pt-2">{item.fullGuidance}</p>

                          <div className="space-y-1.5">
                            <h5 className="font-bold text-emerald-300 text-[11px]">Recommended Action Steps:</h5>
                            <ul className="space-y-1 pl-4 list-disc text-neutral-300 text-[11px]">
                              {item.safeActionSteps.map((step, sIdx) => (
                                <li key={sIdx}>{step}</li>
                              ))}
                            </ul>
                          </div>

                          {item.warningSigns && (
                            <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1">
                              <h5 className="font-bold text-red-300 text-[11px] flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                <span>Red Flag Symptoms (Immediate Hospital/Doctor):</span>
                              </h5>
                              <ul className="list-disc pl-4 text-[10px] text-red-200 space-y-0.5">
                                {item.warningSigns.map((w, wIdx) => (
                                  <li key={wIdx}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VITALS MONITOR & STANDARD CLINICAL RANGES CHART */}
          {activeTab === "vitals" && (
            <div className="space-y-4">
              {/* Current Patient Vitals Strip */}
              <div className="flex items-center justify-between bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Patient&apos;s Current Vitals Assessment</h4>
                  <p className="text-[11px] text-neutral-400">
                    Last logged: {vitals?.lastUpdated || "Today at 08:30 AM"}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditVitals(!showEditVitals)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold"
                >
                  {showEditVitals ? "Cancel" : "Update Vitals"}
                </button>
              </div>

              {/* Edit vitals form */}
              {showEditVitals && (
                <form
                  onSubmit={handleSaveVitals}
                  className="p-4 bg-neutral-950 rounded-2xl border border-teal-500/30 space-y-3 text-xs"
                >
                  <h4 className="font-bold text-teal-300">Log New Clinical Readings:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">BP Systolic (mmHg)</label>
                      <input
                        type="number"
                        value={vitalsForm.bloodPressureSystolic || ""}
                        onChange={(e) =>
                          setVitalsForm({ ...vitalsForm, bloodPressureSystolic: Number(e.target.value) })
                        }
                        placeholder="120"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">BP Diastolic (mmHg)</label>
                      <input
                        type="number"
                        value={vitalsForm.bloodPressureDiastolic || ""}
                        onChange={(e) =>
                          setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: Number(e.target.value) })
                        }
                        placeholder="80"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Pulse / Heart Rate (BPM)</label>
                      <input
                        type="number"
                        value={vitalsForm.heartRate || ""}
                        onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: Number(e.target.value) })}
                        placeholder="72"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Fasting Sugar (mg/dL)</label>
                      <input
                        type="number"
                        value={vitalsForm.bloodSugarFasting || ""}
                        onChange={(e) =>
                          setVitalsForm({ ...vitalsForm, bloodSugarFasting: Number(e.target.value) })
                        }
                        placeholder="98"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Post-Meal Sugar (mg/dL)</label>
                      <input
                        type="number"
                        value={vitalsForm.bloodSugarPostMeal || ""}
                        onChange={(e) =>
                          setVitalsForm({ ...vitalsForm, bloodSugarPostMeal: Number(e.target.value) })
                        }
                        placeholder="136"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">SpO2 Oxygen (%)</label>
                      <input
                        type="number"
                        value={vitalsForm.oxygenSaturation || ""}
                        onChange={(e) =>
                          setVitalsForm({ ...vitalsForm, oxygenSaturation: Number(e.target.value) })
                        }
                        placeholder="98"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-white"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs"
                  >
                    Save &amp; Recalculate Assessment
                  </button>
                </form>
              )}

              {/* Vitals evaluation cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evaluatedVitals.map((v, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border space-y-1.5 ${
                      v.status === "optimal" || v.status === "normal"
                        ? "bg-neutral-950/80 border-emerald-500/30"
                        : v.status === "elevated"
                        ? "bg-neutral-950/80 border-amber-500/40"
                        : "bg-red-950/30 border-red-500/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.metric}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                          v.status === "normal" || v.status === "optimal"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-600/30"
                            : v.status === "elevated"
                            ? "bg-amber-950 text-amber-300 border border-amber-600/30"
                            : "bg-red-950 text-red-300 border border-red-600/30"
                        }`}
                      >
                        {v.value}
                      </span>
                    </div>

                    <div className="text-[11px] font-semibold text-neutral-300">{v.statusLabel}</div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{v.recommendation}</p>
                  </div>
                ))}
              </div>

              {/* Standard Clinical Reference Ranges Table */}
              <div className="bg-neutral-950/80 rounded-2xl border border-neutral-800 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white">Standard Clinical Reference Ranges (Adults &amp; Seniors)</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 text-neutral-400">
                        <th className="py-2 pr-3 font-semibold">Vital Sign</th>
                        <th className="py-2 pr-3 font-semibold text-emerald-400">Optimal</th>
                        <th className="py-2 pr-3 font-semibold text-blue-400">Normal</th>
                        <th className="py-2 pr-3 font-semibold text-amber-400">Borderline / Elevated</th>
                        <th className="py-2 font-semibold text-red-400">High / Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {STANDARD_VITALS_RANGES.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-neutral-900/40">
                          <td className="py-2.5 pr-3 font-medium text-white">
                            {r.name} <span className="text-[10px] text-neutral-500">({r.unit})</span>
                          </td>
                          <td className="py-2.5 pr-3 text-emerald-300">{r.optimal}</td>
                          <td className="py-2.5 pr-3 text-blue-300">{r.normal}</td>
                          <td className="py-2.5 pr-3 text-amber-300">{r.elevated}</td>
                          <td className="py-2.5 text-red-300 font-semibold">{r.critical}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DRUG SAFETY & INTERACTION CHECKER */}
          {activeTab === "drug_checker" && (
            <div className="space-y-4">
              <div className="bg-neutral-950/80 p-4 rounded-2xl border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">Interactive Drug Interaction &amp; Safety Matrix</h4>
                </div>
                <p className="text-neutral-400 text-xs">
                  Check if an over-the-counter painkiller, supplement, or food safely combines with {profile.recipientName}&apos;s prescriptions (Amlodipine, Metformin, Atorvastatin) or Penicillin allergy.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Medication 1 / Active Prescription:</label>
                    <input
                      type="text"
                      value={drugA}
                      onChange={(e) => setDrugA(e.target.value)}
                      placeholder="e.g. Amlodipine 5mg"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Medication 2 / OTC / Food Item:</label>
                    <input
                      type="text"
                      value={drugB}
                      onChange={(e) => setDrugB(e.target.value)}
                      placeholder="e.g. Ibuprofen / Grapefruit"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="text-neutral-500 py-1">Quick check presets:</span>
                    <button
                      onClick={() => {
                        setDrugA("Amlodipine");
                        setDrugB("Ibuprofen");
                        setInteractionResult(checkDrugInteractions("Amlodipine", "Ibuprofen"));
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                    >
                      Amlodipine + Ibuprofen
                    </button>
                    <button
                      onClick={() => {
                        setDrugA("Amoxicillin");
                        setDrugB("Patient Allergy");
                        setInteractionResult(checkDrugInteractions("Amoxicillin", "Patient Allergy"));
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                    >
                      Amoxicillin (Penicillin)
                    </button>
                    <button
                      onClick={() => {
                        setDrugA("Amlodipine");
                        setDrugB("Paracetamol");
                        setInteractionResult(checkDrugInteractions("Amlodipine", "Paracetamol"));
                      }}
                      className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800"
                    >
                      Amlodipine + Paracetamol
                    </button>
                  </div>

                  <button
                    onClick={runDrugCheck}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Analyze Safety
                  </button>
                </div>
              </div>

              {/* Interaction Result Display */}
              {interactionResult && (
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    interactionResult.severity === "critical"
                      ? "bg-red-950/40 border-red-500/60"
                      : interactionResult.severity === "dangerous"
                      ? "bg-amber-950/40 border-amber-500/60"
                      : interactionResult.severity === "safe"
                      ? "bg-emerald-950/40 border-emerald-500/40"
                      : "bg-neutral-950/80 border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold flex items-center gap-1.5 ${
                        interactionResult.severity === "critical" || interactionResult.severity === "dangerous"
                          ? "text-red-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {interactionResult.severity === "critical" || interactionResult.severity === "dangerous" ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>{interactionResult.summary}</span>
                    </h4>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold ${
                        interactionResult.severity === "critical"
                          ? "bg-red-900 text-red-200"
                          : interactionResult.severity === "dangerous"
                          ? "bg-amber-900 text-amber-200"
                          : "bg-emerald-900 text-emerald-200"
                      }`}
                    >
                      {interactionResult.severity}
                    </span>
                  </div>

                  <p className="text-neutral-300 leading-relaxed text-xs">
                    {interactionResult.details}
                  </p>

                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                    <strong className="text-white text-[11px] block">Doctor-Grounded Action:</strong>
                    <p className="text-neutral-300 text-[11px] leading-relaxed">
                      {interactionResult.actionRecommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COMPLETE MEDICAL RECORDS & PRESCRIPTION OVERVIEW */}
          {activeTab === "records" && (
            <div className="space-y-4">
              {/* Prescriptions card */}
              <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">Active Daily Prescriptions ({medications.length})</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {medications.map((m) => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-xs">{m.name}</strong>
                        <span className="text-[10px] font-mono text-emerald-400">{m.time}</span>
                      </div>
                      <p className="text-[11px] text-neutral-300">Dose: {m.dosage}</p>
                      {m.purpose && (
                        <p className="text-[10px] text-neutral-400">Purpose: {m.purpose}</p>
                      )}
                      {m.notes && <p className="text-[10px] text-neutral-500 italic">{m.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical History Records */}
              <div className="p-4 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-bold text-white">Documented Clinical Records</h4>
                </div>

                <div className="space-y-2">
                  {(medicalRecords || []).map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{rec.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {rec.date || "Active"}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-relaxed">{rec.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zoya AI Clinical Guardian • 24/7 Triage &amp; Vitals Support</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${profile.emergencyContactPhone}`}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Family</span>
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
