export type AppMode = 'companion' | 'caretaker';
export * from './vision';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string; // e.g. "08:00 AM", "01:30 PM", "08:00 PM"
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  takenToday: boolean;
  foodRelation?: 'before_meal' | 'with_meal' | 'after_meal' | 'empty_stomach';
  purpose?: string; // e.g. "Blood Pressure Regulation", "Blood Glucose Control"
  prescribingDoctor?: string;
  notes?: string;
}

export interface CareProfile {
  recipientName: string;
  guardianName?: string;
  relationship: string;
  age: string;
  gender?: string;
  bloodGroup: string;
  allergies: string;
  conditions: string;
  dietaryRestrictions?: string; // e.g. "Low Sodium, Low Glycemic Index, Cardiac Safe"
  emergencyContactName: string;
  emergencyContactPhone: string;
  doctorName: string;
  doctorPhone: string;
  doctorSpecialty?: string; // e.g. "Cardiologist & Senior Physician"
  hospitalName?: string; // e.g. "Apollo Hospital Emergency"
  hospitalPhone?: string;
  homeAddress: string;
  insurancePolicyNumber?: string;
}

export interface MedicalVitals {
  bloodPressureSystolic?: number; // mmHg (e.g. 120)
  bloodPressureDiastolic?: number; // mmHg (e.g. 80)
  heartRate?: number; // bpm (e.g. 72)
  bloodSugarFasting?: number; // mg/dL (e.g. 98)
  bloodSugarPostMeal?: number; // mg/dL (e.g. 136)
  oxygenSaturation?: number; // SpO2 % (e.g. 98)
  temperature?: number; // °F (e.g. 98.6)
  weightKg?: number; // kg (e.g. 68)
  heightCm?: number; // cm (e.g. 170)
  bmi?: number; // calculated BMI (e.g. 23.5)
  lastUpdated?: string;
}

export interface MedicalRecordEntry {
  id: string;
  category: 'condition' | 'allergy' | 'surgery' | 'lab_report' | 'lifestyle';
  title: string;
  details: string;
  date?: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface MedicalAdviceItem {
  id: string;
  topic: string;
  category: 'vitals' | 'medication_safety' | 'diet_nutrition' | 'first_aid' | 'emergency';
  summary: string;
  fullGuidance: string;
  safeActionSteps: string[];
  warningSigns?: string[];
}

export type WellnessMood = 'energetic' | 'peaceful' | 'tired' | 'dizzy' | 'pain';

export interface WellnessEntry {
  timestamp: string;
  mood: WellnessMood;
  painLevel?: number; // 0-10
  notes?: string;
}

export interface CaretakerState {
  profile: CareProfile;
  medications: Medication[];
  vitals?: MedicalVitals;
  medicalRecords?: MedicalRecordEntry[];
  waterGlasses: number;
  waterTarget: number;
  wellnessLogs: WellnessEntry[];
  lastCheckIn: string;
  accessibilityFontSize: 'normal' | 'large';
  emergencyActive: boolean;
  emergencyTriggerReason?: string;
  reminderSettings?: {
    enabled: boolean;
    intervalMinutes: number; // e.g. 15, 30, 60, or 1 (for testing)
    audioPrompt: boolean; // Speak reminder with Zoya voice
    soundChime: boolean; // Play gentle chime
  };
}
