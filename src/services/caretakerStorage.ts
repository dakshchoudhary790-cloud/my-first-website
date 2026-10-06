import {
  CaretakerState,
  Medication,
  CareProfile,
  MedicalVitals,
  MedicalRecordEntry,
} from '../types/caretaker';

const STORAGE_KEY = 'zoya_caretaker_state_v1';

export const defaultProfile: CareProfile = {
  recipientName: 'Nitin',
  relationship: 'Care Recipient',
  age: '68',
  gender: 'Male',
  bloodGroup: 'B+',
  allergies: 'Penicillin (Severe rash), Dust mites, Shellfish',
  conditions: 'Stage 1 Hypertension, Type 2 Diabetes Mellitus, Mild Knee Osteoarthritis',
  dietaryRestrictions: 'Low Sodium (<2g/day), Low Glycemic Index, Adequate Hydration',
  emergencyContactName: 'Dr. Rajesh Sharma (Son)',
  emergencyContactPhone: '+919876543210',
  doctorName: 'Dr. Priya Varma',
  doctorPhone: '+919812345678',
  doctorSpecialty: 'Cardiologist & Senior Consultant',
  hospitalName: 'Apollo Hospital & Emergency Care',
  hospitalPhone: '+911126925858',
  homeAddress: 'Flat 402, Green Meadows, Sector 15, Gurugram',
  insurancePolicyNumber: 'STAR-HEALTH-994821',
};

export const defaultVitals: MedicalVitals = {
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 72,
  bloodSugarFasting: 98,
  bloodSugarPostMeal: 136,
  oxygenSaturation: 98,
  temperature: 98.6,
  weightKg: 68,
  heightCm: 170,
  bmi: 23.5,
  lastUpdated: 'Today at 08:30 AM',
};

export const defaultMedicalRecords: MedicalRecordEntry[] = [
  {
    id: 'rec-1',
    category: 'condition',
    title: 'Essential Hypertension (Stage 1 Controlled)',
    details: 'Diagnosed 4 years ago. Controlled with daily Amlodipine 5mg. Target BP < 130/80 mmHg. Monitor every 2-3 days.',
    date: 'Ongoing Care',
    severity: 'moderate',
  },
  {
    id: 'rec-2',
    category: 'condition',
    title: 'Type 2 Diabetes Mellitus (HbA1c: 6.4%)',
    details: 'Well-regulated on Metformin 500mg with dinner. Regular fasting & post-prandial blood glucose checks.',
    date: 'Ongoing Care',
    severity: 'moderate',
  },
  {
    id: 'rec-3',
    category: 'allergy',
    title: 'Severe Penicillin / Amoxicillin Allergy',
    details: 'Triggers severe urticarial rash, itching & throat tightness. Strict avoidance of all beta-lactam antibiotics.',
    date: 'Critical Precaution',
    severity: 'severe',
  },
  {
    id: 'rec-4',
    category: 'condition',
    title: 'Mild Knee Osteoarthritis (Right Joint)',
    details: 'Age-related cartilage wear. Managed with gentle low-impact walking, warm compresses & Calcium + D3 supplement.',
    date: 'Active',
    severity: 'mild',
  },
  {
    id: 'rec-5',
    category: 'lifestyle',
    title: 'Cardio-Diabetic Medical Nutrition Protocol',
    details: 'Sodium strictly < 2.0g/day. Complex carbs only, zero refined sugars. Minimum 8 glasses (2 Liters) water daily.',
    date: 'Daily Protocol',
    severity: 'mild',
  },
];

export const defaultMedications: Medication[] = [
  {
    id: 'med-1',
    name: 'Amlodipine (Blood Pressure Control)',
    dosage: '5mg - 1 tablet',
    time: '08:00 AM',
    period: 'morning',
    takenToday: false,
    foodRelation: 'after_meal',
    purpose: 'Lowers blood pressure & relaxes blood vessels',
    prescribingDoctor: 'Dr. Priya Varma',
    notes: 'Take after light breakfast with water. Avoid skipping doses.',
  },
  {
    id: 'med-2',
    name: 'Calcium & Vitamin D3 Forte',
    dosage: '500mg - 1 tablet',
    time: '01:30 PM',
    period: 'afternoon',
    takenToday: false,
    foodRelation: 'after_meal',
    purpose: 'Maintains bone density & knee joint support',
    prescribingDoctor: 'Dr. Priya Varma',
    notes: 'Take after lunch. Helps calcium absorption.',
  },
  {
    id: 'med-3',
    name: 'Metformin Hydrochloride (Glucophage)',
    dosage: '500mg - 1 tablet',
    time: '08:00 PM',
    period: 'evening',
    takenToday: false,
    foodRelation: 'with_meal',
    purpose: 'Controls blood glucose levels & enhances insulin sensitivity',
    prescribingDoctor: 'Dr. Anurag Mehra (Endocrinologist)',
    notes: 'Take with dinner to prevent stomach upset.',
  },
  {
    id: 'med-4',
    name: 'Atorvastatin (Cardioprotective)',
    dosage: '10mg - 1 tablet',
    time: '09:30 PM',
    period: 'night',
    takenToday: false,
    foodRelation: 'after_meal',
    purpose: 'Stabilizes cholesterol & protects heart arteries',
    prescribingDoctor: 'Dr. Priya Varma',
    notes: 'Take at night before going to sleep.',
  },
];

export function getInitialCaretakerState(): CaretakerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Check if day changed to reset daily flags
      const todayStr = new Date().toISOString().split('T')[0];
      const lastCheckDay = parsed.lastCheckIn ? parsed.lastCheckIn.split('T')[0] : '';
      if (lastCheckDay !== todayStr) {
        parsed.waterGlasses = 0;
        parsed.medications = (parsed.medications || defaultMedications).map((m: Medication) => ({
          ...m,
          takenToday: false,
        }));
        parsed.lastCheckIn = new Date().toISOString();
      }

      // Ensure full medical info exists
      return {
        profile: { ...defaultProfile, ...(parsed.profile || {}) },
        medications: parsed.medications || defaultMedications,
        vitals: { ...defaultVitals, ...(parsed.vitals || {}) },
        medicalRecords: parsed.medicalRecords || defaultMedicalRecords,
        waterGlasses: typeof parsed.waterGlasses === 'number' ? parsed.waterGlasses : 3,
        waterTarget: parsed.waterTarget || 8,
        wellnessLogs: parsed.wellnessLogs || [],
        lastCheckIn: parsed.lastCheckIn || new Date().toISOString(),
        accessibilityFontSize: parsed.accessibilityFontSize || 'normal',
        emergencyActive: false,
        reminderSettings: parsed.reminderSettings || {
          enabled: true,
          intervalMinutes: 15,
          audioPrompt: true,
          soundChime: true,
        },
      };
    }
  } catch (e) {
    console.error('Error loading caretaker state from storage', e);
  }

  return {
    profile: defaultProfile,
    medications: defaultMedications,
    vitals: defaultVitals,
    medicalRecords: defaultMedicalRecords,
    waterGlasses: 3,
    waterTarget: 8,
    wellnessLogs: [
      {
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        mood: 'peaceful',
        notes: 'Feeling calm after breakfast and morning Amlodipine.',
      },
    ],
    lastCheckIn: new Date().toISOString(),
    accessibilityFontSize: 'normal',
    emergencyActive: false,
    reminderSettings: {
      enabled: true,
      intervalMinutes: 15,
      audioPrompt: true,
      soundChime: true,
    },
  };
}

export function saveCaretakerState(state: CaretakerState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving caretaker state to storage', e);
  }
}
