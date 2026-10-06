export type CameraPosition = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left' | 'fullscreen';

export type RecognizedActivityType =
  | 'drinking_water'
  | 'taking_medication'
  | 'sitting_resting'
  | 'walking_movement'
  | 'reading_working'
  | 'exercising_stretching'
  | 'eating_meal'
  | 'abnormal_fall'
  | 'abnormal_distress'
  | 'person_away'
  | 'general_presence';

export interface DetectedPerson {
  id: string;
  role: 'primary_user' | 'companion' | 'visitor' | 'family_member' | 'bystander';
  description: string;
  clothingColors: string;
  clothingDetails?: string;
  position: string;
  activity: string;
}

export interface ClothingInfo {
  topColor: string;
  bottomColor?: string;
  overallDescription: string;
  patternsOrStyle?: string;
  accessories: string[];
}

export interface WholeBodyInfo {
  posture: string;
  visiblePortion: 'head_and_shoulders' | 'upper_body' | 'torso_and_legs' | 'full_body';
  headAndFace: string;
  handsAndArms: string;
  lowerBody?: string;
  energyAndVibe: string;
}

export interface PersonalityAIEyeAnalysis {
  vibeTitle: string; // e.g. "Thoughtful Innovator", "Calm & Grounded Soul", "Dynamic Achiever"
  auraColor: string; // e.g. "Emerald Sage", "Celestial Indigo", "Radiant Amber"
  moodDetected: string; // e.g. "Calm, Contemplative & Focused"
  traits: string[]; // e.g. ["Deep thinker", "Attentive listener", "Warm presence"]
  expression: string; // e.g. "Gentle, focused gaze with a subtle reassuring smile"
  styleAndSetting: string; // e.g. "Comfortable attire in ambient indoor lighting"
  objectsObserved: string[]; // e.g. ["Water glass", "Phone", "Notebook", "Eyeglasses"]
  wholePersonAnalysis: string; // Detailed, perceptive paragraph from Zoya describing their persona and presence
}

export interface VisionObservation {
  timestamp: string;
  activity: string;
  recognizedActivityType: RecognizedActivityType;
  confidence: number; // 0-100
  bodyLanguage: string;
  eyeCommentary: string; // Zoya's spoken remark in friendly Hinglish/English
  peopleCount: number;
  people: DetectedPerson[];
  clothing: ClothingInfo;
  wholeBody: WholeBodyInfo;
  personality: PersonalityAIEyeAnalysis;
  emergencyDetected: boolean;
  emergencyReason?: string;
}

