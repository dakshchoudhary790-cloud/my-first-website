import { GoogleGenAI } from "@google/genai";
import {
  CareProfile,
  Medication,
  MedicalVitals,
  MedicalRecordEntry,
  MedicalAdviceItem,
} from "../types/caretaker";

export interface VitalsAssessment {
  metric: string;
  value: string;
  status: "optimal" | "normal" | "elevated" | "high" | "critical";
  statusLabel: string;
  recommendation: string;
}

export interface StandardVitalRange {
  name: string;
  unit: string;
  optimal: string;
  normal: string;
  elevated: string;
  critical: string;
  clinicalNote: string;
}

/**
 * Standard Clinical Reference Ranges Table for Senior Citizens & Adults
 */
export const STANDARD_VITALS_RANGES: StandardVitalRange[] = [
  {
    name: "Blood Pressure (Systolic)",
    unit: "mmHg",
    optimal: "< 120",
    normal: "120 - 129",
    elevated: "130 - 139 (Stage 1)",
    critical: "≥ 140 (Stage 2) / ≥ 180 (Crisis)",
    clinicalNote: "Target for seniors on antihypertensives is < 130 mmHg systolic to prevent stroke and renal injury.",
  },
  {
    name: "Blood Pressure (Diastolic)",
    unit: "mmHg",
    optimal: "< 80",
    normal: "< 80",
    elevated: "80 - 89 (Stage 1)",
    critical: "≥ 90 (Stage 2) / ≥ 120 (Crisis)",
    clinicalNote: "Elevated diastolic pressure reflects peripheral vascular resistance.",
  },
  {
    name: "Fasting Blood Sugar",
    unit: "mg/dL",
    optimal: "70 - 99",
    normal: "70 - 99",
    elevated: "100 - 125 (Pre-diabetes)",
    critical: "< 70 (Hypo) or ≥ 126 (Diabetes)",
    clinicalNote: "Take fasting reading right upon waking before breakfast or tea.",
  },
  {
    name: "Post-Meal Blood Sugar (PP)",
    unit: "mg/dL",
    optimal: "< 140",
    normal: "< 140",
    elevated: "140 - 199 (Impaired)",
    critical: "≥ 200 mg/dL",
    clinicalNote: "Measured exactly 2 hours after the start of a meal.",
  },
  {
    name: "Resting Heart Rate (Pulse)",
    unit: "BPM",
    optimal: "60 - 80",
    normal: "60 - 100",
    elevated: "101 - 120 (Tachycardia)",
    critical: "< 50 (Bradycardia) or > 120",
    clinicalNote: "Resting pulse measured after sitting calmly for 5 minutes.",
  },
  {
    name: "Oxygen Saturation (SpO2)",
    unit: "%",
    optimal: "96 - 100",
    normal: "95 - 100",
    elevated: "91 - 94 (Mild Hypoxia)",
    critical: "< 90% (Urgent Hypoxia)",
    clinicalNote: "Readings below 92% in room air warrant supplemental oxygen and medical review.",
  },
  {
    name: "Body Temperature",
    unit: "°F",
    optimal: "97.8 - 98.6",
    normal: "97.5 - 99.0",
    elevated: "99.5 - 100.4 (Low-grade)",
    critical: "≥ 101.0°F (Active Fever)",
    clinicalNote: "Seniors may exhibit blunted fever response; even 99.5°F can indicate infection.",
  },
  {
    name: "Body Mass Index (BMI)",
    unit: "kg/m²",
    optimal: "18.5 - 22.9 (Asian norm)",
    normal: "18.5 - 24.9",
    elevated: "25.0 - 29.9 (Overweight)",
    critical: "< 18.5 (Underweight) or ≥ 30 (Obese)",
    clinicalNote: "Maintaining healthy BMI significantly reduces cardiac workload and joint stress.",
  },
];

/**
 * Common Drug Interactions & Safety Matrix
 */
export interface DrugInteractionResult {
  severity: "safe" | "caution" | "dangerous" | "critical";
  summary: string;
  details: string;
  actionRecommendation: string;
}

export function checkDrugInteractions(drugA: string, drugB: string): DrugInteractionResult {
  const a = drugA.toLowerCase().trim();
  const b = drugB.toLowerCase().trim();

  // 1. NSAIDs (Ibuprofen, Diclofenac, Naproxen) with Amlodipine / Blood Pressure meds
  if (
    (a.includes("amlodipine") || a.includes("bp") || a.includes("hypertension") || b.includes("amlodipine") || b.includes("bp")) &&
    (a.includes("ibuprofen") || a.includes("diclofenac") || a.includes("naproxen") || a.includes("brufen") || a.includes("voveran") ||
     b.includes("ibuprofen") || b.includes("diclofenac") || b.includes("naproxen") || b.includes("brufen") || b.includes("voveran"))
  ) {
    return {
      severity: "dangerous",
      summary: "Dangerous: NSAID Painkillers blunt Amlodipine and raise Blood Pressure!",
      details:
        "NSAIDs (Ibuprofen, Diclofenac, Naproxen) inhibit prostaglandins, leading to renal vasoconstriction, sodium retention, and acute BP elevation. They counteract antihypertensive drugs like Amlodipine and increase kidney stress.",
      actionRecommendation:
        "Avoid NSAIDs! Use Paracetamol (Acetaminophen 500mg-650mg) for fever or headache. Consult Dr. Priya Varma for persistent musculoskeletal pain.",
    };
  }

  // 2. Penicillin / Amoxicillin Allergy
  if (
    a.includes("penicillin") || a.includes("amoxicillin") || a.includes("augmentin") || a.includes("ampicillin") ||
    b.includes("penicillin") || b.includes("amoxicillin") || b.includes("augmentin") || b.includes("ampicillin")
  ) {
    return {
      severity: "critical",
      summary: "CRITICAL ALLERGY ALERT: Documented Severe Penicillin Allergy!",
      details:
        "Patient has a confirmed severe allergy to Penicillin, Amoxicillin, and beta-lactam derivatives (risk of anaphylaxis, widespread urticaria, facial edema, and airway compromise).",
      actionRecommendation:
        "STRICTLY CONTRAINDICATED. Never consume Penicillin or Amoxicillin formulations. Alternative safe antibiotics include Azithromycin or Doxycycline, prescribed strictly by the physician.",
    };
  }

  // 3. Amlodipine + Grapefruit Juice
  if (
    (a.includes("amlodipine") || b.includes("amlodipine")) &&
    (a.includes("grapefruit") || b.includes("grapefruit") || a.includes("pomerac") || b.includes("pomerac"))
  ) {
    return {
      severity: "dangerous",
      summary: "Dangerous Food Interaction: Grapefruit inhibits Amlodipine metabolism!",
      details:
        "Grapefruit juice suppresses the intestinal enzyme CYP3A4, causing massive accumulation of Amlodipine in the bloodstream. This can trigger acute hypotension, severe dizziness, headache, and peripheral edema.",
      actionRecommendation:
        "Avoid grapefruit juice and grapefruit pulp completely while taking Amlodipine. Stick to apples, papayas, and citrus oranges (not bitter grapefruit).",
    };
  }

  // 4. Metformin + Alcohol
  if (
    (a.includes("metformin") || b.includes("metformin")) &&
    (a.includes("alcohol") || b.includes("alcohol") || a.includes("wine") || b.includes("beer") || a.includes("whiskey") || b.includes("whiskey"))
  ) {
    return {
      severity: "dangerous",
      summary: "Dangerous: Metformin and Alcohol increase Lactic Acidosis risk!",
      details:
        "Combining Metformin with significant alcohol consumption impairs hepatic lactate clearance, substantially increasing the risk of potentially fatal Lactic Acidosis and severe hypoglycemia.",
      actionRecommendation:
        "Strictly avoid alcohol while on Metformin therapy. Drink plenty of fresh water and keep meals consistent.",
    };
  }

  // 5. Paracetamol + Amlodipine
  if (
    (a.includes("paracetamol") || a.includes("crocin") || a.includes("calpol") || a.includes("dolo") || b.includes("paracetamol") || b.includes("crocin") || b.includes("dolo")) &&
    (a.includes("amlodipine") || b.includes("amlodipine") || a.includes("metformin") || b.includes("metformin"))
  ) {
    return {
      severity: "safe",
      summary: "Safe Combination: Paracetamol is compatible with Amlodipine & Metformin",
      details:
        "Paracetamol (Crocin / Dolo 650) does not interfere with calcium channels, blood pressure regulation, or insulin sensitivity at therapeutic doses (max 2-3g/day).",
      actionRecommendation:
        "Safe for mild fever, headache, or joint aches. Take with a glass of water after food. Do not exceed 3 tablets in 24 hours.",
    };
  }

  // 6. Atorvastatin + Amlodipine
  if (
    (a.includes("atorvastatin") || a.includes("statin") || b.includes("atorvastatin") || b.includes("statin")) &&
    (a.includes("amlodipine") || b.includes("amlodipine"))
  ) {
    return {
      severity: "safe",
      summary: "Standard Synergistic Combination for Cardiac Protection",
      details:
        "Amlodipine (for BP) and Atorvastatin (for cholesterol stabilization) are frequently co-prescribed in cardiovascular care. Amlodipine may mildly increase statin levels, so moderate statin doses (10-20mg) are standard.",
      actionRecommendation:
        "Take Amlodipine in the morning and Atorvastatin at bedtime. Report any unexplained severe muscle tenderness to Dr. Priya Varma.",
    };
  }

  // Default cautious response
  return {
    severity: "caution",
    summary: `Interaction Check: ${drugA} + ${drugB}`,
    details:
      "Always ensure both medications are recorded in your clinical log. Stagger oral medications by at least 1-2 hours unless specifically advised by your doctor to take together.",
    actionRecommendation:
      "Verify with Dr. Priya Varma (+919812345678) before starting any new over-the-counter medicine, herbal tonic, or supplement.",
  };
}

/**
 * Evaluate vital signs against standard clinical guidelines
 */
export function evaluatePatientVitals(vitals?: MedicalVitals): VitalsAssessment[] {
  if (!vitals) return [];
  const results: VitalsAssessment[] = [];

  // 1. Blood Pressure
  if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
    const sys = vitals.bloodPressureSystolic;
    const dia = vitals.bloodPressureDiastolic;
    let status: VitalsAssessment["status"] = "normal";
    let label = "Normal BP (< 120/80)";
    let rec = "Excellent blood pressure. Maintain daily Amlodipine schedule and low-sodium diet.";

    if (sys >= 180 || dia >= 120) {
      status = "critical";
      label = "Hypertensive Crisis (≥ 180/120)";
      rec = "Emergency! Rest immediately. If accompanied by headache, chest tightness, or blurry vision, call 112 or Doctor.";
    } else if (sys >= 140 || dia >= 90) {
      status = "high";
      label = "Stage 2 Hypertension (≥ 140/90)";
      rec = "Elevated reading. Avoid salt, take prescribed Amlodipine on time, re-check in 30 minutes, and notify Dr. Priya Varma.";
    } else if (sys >= 130 || dia >= 80) {
      status = "elevated";
      label = "Stage 1 Hypertension (130-139 / 80-89)";
      rec = "Slightly elevated. Practice 5 minutes of calm deep breathing, reduce mental stress, and ensure proper hydration.";
    } else if (sys < 90 || dia < 60) {
      status = "high";
      label = "Hypotension / Low BP (< 90/60)";
      rec = "Blood pressure is low. Drink a glass of water with light electrolytes, sit down slowly, and avoid sudden standing.";
    }

    results.push({
      metric: "Blood Pressure",
      value: `${sys}/${dia} mmHg`,
      status,
      statusLabel: label,
      recommendation: rec,
    });
  }

  // 2. Blood Sugar (Fasting)
  if (vitals.bloodSugarFasting) {
    const fbs = vitals.bloodSugarFasting;
    let status: VitalsAssessment["status"] = "normal";
    let label = "Normal Fasting (70-99 mg/dL)";
    let rec = "Fasting glucose is in optimal healthy range.";

    if (fbs < 70) {
      status = "critical";
      label = "Hypoglycemia (< 70 mg/dL)";
      rec = "Sugar is dangerously low! Follow the 15-15 Rule: take 15g fast-acting sugar (fruit juice, candy, honey), recheck in 15 mins.";
    } else if (fbs >= 126) {
      status = "high";
      label = "High Fasting Sugar (≥ 126 mg/dL)";
      rec = "Fasting glucose elevated. Keep carbohydrates low, drink plenty of water, and ensure Metformin taken with dinner.";
    } else if (fbs >= 100) {
      status = "elevated";
      label = "Pre-diabetic / Slightly High (100-125 mg/dL)";
      rec = "Slightly high fasting sugar. Opt for high-fiber morning meals (oats, eggs, vegetables).";
    }

    results.push({
      metric: "Fasting Blood Glucose",
      value: `${fbs} mg/dL`,
      status,
      statusLabel: label,
      recommendation: rec,
    });
  }

  // 3. Post-Meal Blood Sugar
  if (vitals.bloodSugarPostMeal) {
    const pp = vitals.bloodSugarPostMeal;
    let status: VitalsAssessment["status"] = "normal";
    let label = "Normal Post-Meal (< 140 mg/dL)";
    let rec = "Post-meal glucose level is optimal.";

    if (pp >= 200) {
      status = "high";
      label = "High Post-Meal (≥ 200 mg/dL)";
      rec = "High sugar spike. Avoid sweets and white rice. Take a 15-minute gentle post-meal walk.";
    } else if (pp >= 140) {
      status = "elevated";
      label = "Elevated Post-Meal (140-199 mg/dL)";
      rec = "Moderate elevation. Balance meals with green vegetables, proteins, and whole grains.";
    }

    results.push({
      metric: "Post-Meal Glucose",
      value: `${pp} mg/dL`,
      status,
      statusLabel: label,
      recommendation: rec,
    });
  }

  // 4. Heart Rate (Pulse)
  if (vitals.heartRate) {
    const hr = vitals.heartRate;
    let status: VitalsAssessment["status"] = "normal";
    let label = "Normal Resting Heart Rate (60-100 BPM)";
    let rec = "Heart rate is steady and healthy.";

    if (hr > 120) {
      status = "critical";
      label = "Tachycardia (> 120 BPM)";
      rec = "Significantly rapid heartbeat. Sit down, breathe deeply, and contact cardiologist if accompanied by palpitations or dizziness.";
    } else if (hr > 100) {
      status = "elevated";
      label = "Elevated Heart Rate (101-120 BPM)";
      rec = "Heart rate is elevated. Check for dehydration, caffeine intake, or anxiety. Rest calmly.";
    } else if (hr < 50) {
      status = "high";
      label = "Bradycardia (< 50 BPM)";
      rec = "Unusually low heart rate. If feeling faint or lightheaded, seek clinical assessment.";
    }

    results.push({
      metric: "Heart Rate (Pulse)",
      value: `${hr} BPM`,
      status,
      statusLabel: label,
      recommendation: rec,
    });
  }

  // 5. Oxygen Saturation (SpO2)
  if (vitals.oxygenSaturation) {
    const spo2 = vitals.oxygenSaturation;
    let status: VitalsAssessment["status"] = "normal";
    let label = "Optimal Oxygen (95-100%)";
    let rec = "Blood oxygen saturation is excellent.";

    if (spo2 < 90) {
      status = "critical";
      label = "Severe Hypoxia (< 90%)";
      rec = "Urgent clinical attention needed! Sit upright, take slow deep breaths, and call 112 or physician immediately.";
    } else if (spo2 < 95) {
      status = "high";
      label = "Low Oxygen (90-94%)";
      rec = "Oxygen levels are below target. Ensure room ventilation, practice deep diaphragmatic breathing, and monitor closely.";
    }

    results.push({
      metric: "Blood Oxygen (SpO2)",
      value: `${spo2}%`,
      status,
      statusLabel: label,
      recommendation: rec,
    });
  }

  // 6. Body Temperature
  if (vitals.temperature) {
    const temp = vitals.temperature;
    let status: VitalsAssessment["status"] = "normal";
    let label = "Normal Body Temp (97.7°F - 99.5°F)";
    let rec = "Body temperature is within normal range.";

    if (temp >= 101) {
      status = "high";
      label = "Fever (≥ 101.0°F)";
      rec = "Active fever detected. Rest, stay well-hydrated with fluids, apply cool forehead compress, and consult doctor for antipyretics.";
    } else if (temp >= 99.6) {
      status = "elevated";
      label = "Low-Grade Fever (99.6°F - 100.9°F)";
      rec = "Mild elevation. Keep warm, drink warm water or herbal tea, and monitor closely.";
    }

    results.push({
      metric: "Body Temperature",
      value: `${temp}°F`,
      status,
      statusLabel: label,
      recommendation: rec,
    });
  }

  return results;
}

/**
 * Curated Clinical Reference Guides for immediate, offline guidance
 */
export const CLINICAL_REFERENCE_LIBRARY: MedicalAdviceItem[] = [
  {
    id: "guide-bp",
    topic: "Blood Pressure Safety & High BP Protocol",
    category: "vitals",
    summary: "Target BP for seniors is under 130/80 mmHg. What to do if blood pressure spikes.",
    fullGuidance:
      "For seniors managing hypertension with daily Amlodipine 5mg, sudden blood pressure readings above 140/90 mmHg require calm management. Avoid panicking as anxiety further raises systolic pressure. Sit comfortably with back supported and feet flat on the floor. Rest quietly for 5 minutes before re-checking. Ensure you took your morning Amlodipine on time. Avoid heavy salt/pickles.",
    safeActionSteps: [
      "Sit upright in a quiet room with legs uncrossed for 5 minutes.",
      "Re-measure blood pressure twice, 2 minutes apart, and record the average.",
      "Check if morning dose of Amlodipine 5mg was missed or delayed.",
      "Drink a glass of plain room-temperature water.",
      "If BP stays above 160/100 or causes throbbing headache, notify Dr. Priya Varma.",
    ],
    warningSigns: [
      "Severe chest pressure, tightness or pain",
      "Sudden weakness or numbness in face, arm, or leg",
      "Blurry vision or sudden difficulty speaking",
      "Shortness of breath with cold sweats",
    ],
  },
  {
    id: "guide-sugar",
    topic: "Diabetes Glucose Management & Hypoglycemia (Sugar Drop)",
    category: "vitals",
    summary: "Managing Type 2 Diabetes with Metformin 500mg, recognizing low sugar vs high sugar.",
    fullGuidance:
      "When blood sugar drops below 70 mg/dL (Hypoglycemia), immediate action is required to prevent fainting. Symptoms include sudden shakiness, cold sweating, hunger pangs, irritability, and rapid heartbeat. Always keep fast-acting carbs near the bed and living room. For high blood sugar (>180 mg/dL), drink plenty of water to help kidneys flush excess glucose and avoid refined sugars, white bread, or fruit juices.",
    safeActionSteps: [
      "Follow the 15-15 Rule for Low Sugar: Eat 15g fast sugar (half cup juice, 3-4 sugar candies, or 1 tablespoon honey).",
      "Wait 15 minutes, rest sitting down, and re-test blood glucose.",
      "If still under 70 mg/dL, repeat 15g sugar.",
      "Once normal, eat a light snack with complex carbs and protein (e.g. crackers or roti).",
      "Always take Metformin 500mg with or right after dinner, never on an empty stomach.",
    ],
    warningSigns: [
      "Extreme confusion, slurred speech or disorientation",
      "Loss of consciousness or seizures",
      "Extreme vomiting preventing water retention",
    ],
  },
  {
    id: "guide-drug-safety",
    topic: "Medication Safety & Dangerous Drug Interactions",
    category: "medication_safety",
    summary: "Critical drug interactions to avoid with Amlodipine, Metformin, and Penicillin allergy.",
    fullGuidance:
      "Patients on Amlodipine (calcium channel blocker) and Metformin must be extremely cautious with over-the-counter painkillers. Common NSAIDs (like Ibuprofen, Brufen, Diclofenac, Naproxen) constrict renal blood vessels and counteract blood pressure medications, causing acute BP spikes and kidney strain. Paracetamol / Acetaminophen (at recommended therapeutic doses) is the preferred safe painkiller. Also, strictly avoid any Penicillin, Amoxicillin, or Augmentin due to documented severe allergy.",
    safeActionSteps: [
      "NEVER take Ibuprofen/Diclofenac without consulting Dr. Priya Varma; use Paracetamol for mild fever or pain.",
      "Remind every doctor, dentist, or pharmacist: 'Patient has severe Penicillin and Amoxicillin allergy'.",
      "Do not drink grapefruit juice while on Amlodipine or Atorvastatin (it dangerously elevates drug blood levels).",
      "Take Metformin with meals to prevent abdominal cramps and diarrhea.",
      "Take Atorvastatin consistently at bedtime for optimal cholesterol synthesis inhibition.",
    ],
    warningSigns: [
      "Sudden hives, wheezing, throat swelling, or difficulty breathing (Anaphylaxis)",
      "Unexplained severe muscle soreness or dark brown urine from statins",
      "Persistent nausea, deep rapid breathing, or severe abdominal pain (Lactic acidosis alert)",
    ],
  },
  {
    id: "guide-fast-stroke",
    topic: "FAST Stroke Recognition Protocol",
    category: "emergency",
    summary: "Recognize acute brain stroke symptoms in seconds using the clinical FAST protocol.",
    fullGuidance:
      "Brain tissue is lost by the minute during an ischemic stroke. Do not wait for symptoms to resolve. Use the universal FAST test: Face (uneven smile/droop), Arms (one arm drifts down when raised), Speech (slurred or confused words), Time (call 112 emergency immediately). Never give food, water, or aspirin until evaluated in a hospital CT scanner.",
    safeActionSteps: [
      "Face: Ask the person to smile. Does one side of the face droop?",
      "Arms: Ask them to raise both arms. Does one arm drift downward?",
      "Speech: Ask them to repeat a simple sentence. Is their speech slurred or strange?",
      "Time: If ANY one of these signs is present, call 112 or transport to emergency immediately.",
      "Note the exact time symptoms first began for the neurologist.",
    ],
    warningSigns: [
      "Sudden numbness or paralysis on one side of body",
      "Sudden loss of vision in one or both eyes",
      "Sudden loss of balance, vertigo, or uncoordinated gait",
      "Sudden severe 'thunderclap' headache with no known cause",
    ],
  },
  {
    id: "guide-chestpain",
    topic: "Chest Discomfort: Heart Attack vs. Acidity Triage",
    category: "emergency",
    summary: "How to differentiate cardiac angina from gastroesophageal reflux and when to call 112.",
    fullGuidance:
      "Chest pain in hypertensive patients must always be treated as potentially cardiac until proven otherwise. Cardiac pain typically feels like heavy pressure, squeezing, or a tight band around the chest, often radiating to the left shoulder, jaw, neck, or back, and may be accompanied by sweating, shortness of breath, and lightheadedness. In contrast, acid reflux tends to produce burning behind the breastbone that worsens when lying flat or bending over.",
    safeActionSteps: [
      "If pressure radiates to arm, neck, or jaw, sit down immediately in semi-reclined 'W' position.",
      "Loosen tight collar, belt, and shirt.",
      "Call emergency ambulance 112 without delay.",
      "If prescribed Sorbitrate (Nitroglycerin) sublingually by cardiologist, administer 1 tablet under tongue.",
      "Keep patient calm, breathe slowly through nose, and avoid physical exertion.",
    ],
    warningSigns: [
      "Crushing retrosternal chest pain lasting > 5 minutes",
      "Cold profuse perspiration (sweating) without heat",
      "Dizziness, nausea, or impending sense of doom",
      "Shortness of breath with blueish lips",
    ],
  },
  {
    id: "guide-dizziness",
    topic: "Senior Dizziness & Fall Prevention Protocol",
    category: "first_aid",
    summary: "How to handle sudden lightheadedness, orthostatic hypotension, and prevent slips/falls.",
    fullGuidance:
      "Dizziness when rising from bed or a chair is commonly Orthostatic Hypotension—a temporary drop in blood pressure as gravity pools blood in the legs, which can be exaggerated by blood pressure medications. Always pause: sit on the edge of the bed for 30 to 60 seconds before standing up, flex your calves and ankles a few times, and take a sip of water.",
    safeActionSteps: [
      "If feeling dizzy, immediately sit down or lie flat with feet slightly elevated.",
      "Take slow, steady breaths through the nose and out through pursed lips.",
      "Drink a glass of water to support circulating blood volume.",
      "When getting out of bed: Sit upright for 1 full minute, pump feet, then stand with support.",
      "Ensure hallways and bathroom are well-lit, free of loose rugs and slippery floors.",
    ],
    warningSigns: [
      "Dizziness accompanied by chest pain, irregular pulse, or breathlessness",
      "Sudden weakness on one side of the body or facial droop",
      "Loss of consciousness (syncope / blackout)",
    ],
  },
  {
    id: "guide-elder-fall",
    topic: "Elder Fall Response & Hip Injury Triage",
    category: "first_aid",
    summary: "What to do immediately after a slip or fall; avoiding spinal and hip aggravation.",
    fullGuidance:
      "Never rush to yank or pull an elderly person upright after a fall. Take 1-2 minutes to assess for head trauma, neck pain, or hip fractures. If the leg looks shortened or rotated outward, or if there is severe pain in the groin/hip, do NOT attempt to walk on it.",
    safeActionSteps: [
      "Remain calm. Ask: 'Are you in severe pain anywhere? Can you move your fingers and toes?'",
      "Check for bleeding, swelling, or bone deformity.",
      "If uninjured: roll onto side, get onto hands and knees, crawl to a sturdy chair, and raise up slowly.",
      "If hip/leg hurts severely: keep still, cover with a warm blanket, and call ambulance 112.",
      "Apply ice pack wrapped in cloth to minor bumps (never direct ice on skin).",
    ],
    warningSigns: [
      "Inability to bear weight on leg or groin deformity",
      "Head hit the ground, disorientation, or vomiting",
      "Bleeding that does not stop with direct pressure",
    ],
  },
  {
    id: "guide-burns",
    topic: "Burns & Scalds Immediate First Aid",
    category: "first_aid",
    summary: "Evidence-based first aid for household burns: the 20-minute cool running water rule.",
    fullGuidance:
      "The only proven medical first aid for burns is immediate, cool running tap water for a full 20 minutes. This halts deep thermal tissue injury. Never apply ice, ice water, toothpaste, butter, raw egg, or turmeric to fresh burns as they trap heat and introduce severe bacterial infection.",
    safeActionSteps: [
      "Hold the burned area under cool running tap water for at least 20 minutes.",
      "Gently remove rings, watches, or tight clothing near the burn before swelling begins.",
      "Cover loosely with sterile non-stick dressing or clean cling film.",
      "Do not pop blisters or scratch peeling skin.",
      "Take Paracetamol for mild pain if approved by doctor.",
    ],
    warningSigns: [
      "Burn is larger than the palm of the patient's hand",
      "Burn involves face, hands, joints, or genitals",
      "Skin looks charred white, leathery, or blackened (3rd degree)",
    ],
  },
  {
    id: "guide-choking",
    topic: "Choking Emergency & Heimlich Maneuver",
    category: "emergency",
    summary: "Immediate lifesaving steps for airway obstruction in adults and seniors.",
    fullGuidance:
      "If the person can cough forcefully or speak, encourage them to keep coughing—do not hit their back yet. If they cannot speak, breathe, or make sound, or are clutching their throat (universal choking sign), deliver 5 firm back blows between shoulder blades followed by 5 abdominal thrusts (Heimlich maneuver).",
    safeActionSteps: [
      "Stand behind the patient and lean them slightly forward.",
      "Deliver 5 firm back blows between shoulder blades with the heel of your hand.",
      "If still choked: make a fist with one hand, place thumb side just above navel, grasp with other hand and pull inward and upward sharply 5 times.",
      "Repeat 5 back blows and 5 abdominal thrusts until object is expelled.",
      "If patient becomes unconscious, lower to floor, call 112, and begin chest compressions.",
    ],
    warningSigns: [
      "Inability to speak, cry, or cough",
      "Skin and lips turning blue or dusky grey",
      "Loss of consciousness",
    ],
  },
  {
    id: "guide-ayurvedic-homecare",
    topic: "Safe Indian Home Remedies & Supportive Care",
    category: "diet_nutrition",
    summary: "Doctor-approved, safe traditional remedies for seniors that complement allopathic meds.",
    fullGuidance:
      "Certain traditional Indian supportive remedies provide gentle, safe relief without interacting adversely with daily Amlodipine or Metformin. Turmeric (Curcumin) in warm milk works as a gentle anti-inflammatory, ginger aids gastric motility, and soaked fenugreek seeds (methi) provide soluble fiber that slows carbohydrate absorption.",
    safeActionSteps: [
      "Haldi Doodh: Half teaspoon pure turmeric in warm milk at bedtime for joint stiffness and restful sleep.",
      "Adrak Tulsi Tea: Fresh ginger and holy basil leaves steeped in warm water for sore throat or morning chill.",
      "Methi Water: 1 tsp fenugreek seeds soaked overnight; sip water in the morning to support digestive fiber.",
      "Coconut Water / Nimbu Paani: Mild electrolyte replenishment on hot afternoons (avoid added table salt if hypertensive).",
      "Always notify doctor before starting concentrated herbal powders or ashwagandha extracts.",
    ],
    warningSigns: [
      "Never replace prescribed Amlodipine or Metformin with home remedies",
      "Avoid raw liquorice (mulethi) in large amounts as it actively raises blood pressure",
    ],
  },
  {
    id: "guide-gerd-acidity",
    topic: "Senior Acidity, GERD & Acid Reflux Relief",
    category: "diet_nutrition",
    summary: "Preventing nighttime acid reflux, throat burning, and digestive bloating in seniors.",
    fullGuidance:
      "In seniors, the lower esophageal sphincter relaxes more easily, allowing stomach acid to splash up into the esophagus. Eating heavy, oily dinners right before lying down is the number one cause. Sleeping with the head of the bed elevated by 6 inches uses gravity to keep stomach acid contained.",
    safeActionSteps: [
      "Finish dinner at least 2.5 to 3 hours before going to bed.",
      "Elevate the head of your bed by 6 inches using an extra wedge pillow.",
      "Avoid trigger foods: deep-fried pakoras, heavy chillies, raw onions, and carbonated sodas.",
      "Sip lukewarm water slowly after meals; do not drink huge gulps of cold water.",
      "Wear loose, comfortable clothing that does not constrict the waist or abdomen.",
    ],
    warningSigns: [
      "Difficulty or pain while swallowing food (Dysphagia)",
      "Vomiting dark material resembling coffee grounds",
      "Unintended significant weight loss",
    ],
  },
  {
    id: "guide-osteoarthritis",
    topic: "Knee Osteoarthritis & Joint Mobility Care",
    category: "first_aid",
    summary: "Managing knee stiffness and cartilage wear safely without kidney-damaging NSAIDs.",
    fullGuidance:
      "Knee osteoarthritis affects cartilage cushioning. While painkillers like Diclofenac or Ibuprofen damage kidneys and spike blood pressure in hypertensive seniors, regular gentle low-impact movement keeps joint synovial fluid circulating and strengthens quadriceps muscles.",
    safeActionSteps: [
      "Apply warm compress or heating pad for 15 minutes in the morning to relieve joint stiffness.",
      "Perform seated leg extensions (straight leg raises) 10 times per leg while sitting in a chair.",
      "Avoid deep squatting, sitting cross-legged on the floor, or climbing steep stairs unnecessarily.",
      "Wear cushioned walking shoes with non-skid rubber soles.",
      "Take Paracetamol (500mg-650mg) only on days with elevated discomfort, staying within 2g/day.",
    ],
    warningSigns: [
      "Sudden extreme joint swelling, redness, and heat (Gout or septic joint alert)",
      "Inability to bend or bear any weight on the knee",
    ],
  },
];

/**
 * Generate AI-Powered Clinical Medical Advice grounded in patient profile
 */
export async function getPersonalizedMedicalAdvice(
  userQuery: string,
  context: {
    profile: CareProfile;
    medications: Medication[];
    vitals?: MedicalVitals;
    medicalRecords?: MedicalRecordEntry[];
  }
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const recipient = context.profile.recipientName || "Nitin";
  const age = context.profile.age || "68";

  const vitalsText = context.vitals
    ? `Blood Pressure: ${context.vitals.bloodPressureSystolic || 120}/${context.vitals.bloodPressureDiastolic || 80} mmHg, Heart Rate: ${context.vitals.heartRate || 72} BPM, Fasting Sugar: ${context.vitals.bloodSugarFasting || 98} mg/dL, Post-Meal Sugar: ${context.vitals.bloodSugarPostMeal || 136} mg/dL, SpO2: ${context.vitals.oxygenSaturation || 98}%, Temp: ${context.vitals.temperature || 98.6}°F, BMI: ${context.vitals.bmi || 23.5}.`
    : "Standard controlled vitals.";

  const medList = context.medications
    .map((m) => `${m.name} (${m.dosage}, timing: ${m.time}, with food: ${m.foodRelation || "after meal"}, purpose: ${m.purpose || "Prescribed"})`)
    .join("; ");

  const prompt = `You are Zoya's Medical Caretaker & Clinical Health Advisor module.
You are providing supportive, evidence-based, compassionate clinical guidance for ${recipient} (Age ${age}, Blood Group: ${context.profile.bloodGroup || "B+"}).

PATIENT'S VERIFIED MEDICAL PROFILE:
- Existing Chronic Conditions: ${context.profile.conditions || "Stage 1 Hypertension, Type 2 Diabetes, Mild Osteoarthritis"}
- Confirmed Severe Allergies: ${context.profile.allergies || "PENICILLIN & AMOXICILLIN (Severe rash / edema)"}
- Current Active Medications: ${medList}
- Dietary Limits: ${context.profile.dietaryRestrictions || "Low Sodium (<2g/day), Low Glycemic Index"}
- Current Vital Signs: ${vitalsText}
- Attending Physician: ${context.profile.doctorName || "Dr. Priya Varma (Cardiologist)"} (${context.profile.doctorPhone || ""})
- Emergency Hospital: ${context.profile.hospitalName || "Apollo Hospital"} (${context.profile.hospitalPhone || "112"})

USER'S MEDICAL QUESTION OR SYMPTOM:
"${userQuery}"

CRITICAL CLINICAL INSTRUCTIONS:
1. Address the patient respectfully as "Sir" or "${recipient} Sir". Use warm, reassuring, and professional language (natural mix of polite English and respectful Roman Hindi/Hinglish).
2. PERSONALIZED MEDICAL EVALUATION:
   - Factor in their exact medical conditions (Hypertension, Diabetes) and active prescriptions (Amlodipine, Metformin, Atorvastatin).
   - If they ask about taking medicines (e.g. painkillers, antibiotics, cold syrups), verify safety! (e.g., WARN against NSAIDs like Ibuprofen/Diclofenac due to BP/kidneys, WARN strongly against Penicillin/Amoxicillin due to allergy, recommend Paracetamol instead).
   - If they report high BP, low sugar, dizziness, fever, or joint pain, provide immediate practical step-by-step guidance.
3. STRUCTURE YOUR ADVICE CLEARLY:
   - 🩺 **Immediate Assessment & Direct Answer**: Clear, reassuring explanation.
   - ⚡ **Practical Action Steps**: 2-3 concrete steps to do right now at home (hydration, posture, timing, rest).
   - ⚠️ **When to Alert Doctor / Red Flags**: Clear warning signs where they must call Dr. Priya Varma or 112 immediately.
4. Keep the tone warm, loving, and encouraging. Never sound alarmist, but maintain high clinical rigor and patient safety.
5. Remind them gently that you are their supportive health guardian and that they can contact Dr. Priya Varma if symptoms persist.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ text: prompt }],
    });

    return (
      response.text ||
      `Sir, maine aapki medical query check ki hai. Aapke BP aur Diabetes medicines (Amlodipine, Metformin) ke sath please hydration maintain kijiye aur aaram se rest lijiye. Kisi bhi badlav ke liye Dr. Priya Varma se zaroor consult karein.`
    );
  } catch (err) {
    console.error("Clinical medical advice error:", err);
    return `Sir, aapke medical records ke anusaar, kripya aaram se rest kijiye, paani pijiye aur apni regular scheduled dawaiyaan time par lein. Agar problem continue ho rahi hai, toh Dr. Priya Varma (+919812345678) ya emergency number par turant contact kijiye.`;
  }
}
