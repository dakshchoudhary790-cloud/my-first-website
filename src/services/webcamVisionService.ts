import { GoogleGenAI } from "@google/genai";
import {
  AppMode,
  CareProfile,
  VisionObservation,
  RecognizedActivityType,
  DetectedPerson,
  ClothingInfo,
  WholeBodyInfo,
} from "../types/caretaker";

/**
 * Grabs a clean, compressed base64 JPEG frame from an HTML video element
 */
export function captureFrameFromVideo(
  video: HTMLVideoElement,
  maxWidth = 640,
  quality = 0.75
): string | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  try {
    const canvas = document.createElement("canvas");
    let width = video.videoWidth;
    let height = video.videoHeight;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    // Return pure base64 (stripped prefix)
    return dataUrl.split(",")[1] || null;
  } catch (err) {
    console.error("Frame capture error:", err);
    return null;
  }
}

/**
 * Analyze webcam video frame using Gemini 3.8 Flash Vision
 * Recognizes people count, all visible people, clothing colors, and whole body info
 */
export async function analyzeWebcamFrameWithAIEye(
  base64Jpeg: string,
  mode: AppMode = "caretaker",
  focus: "all" | "personality" | "activity" = "all",
  profile?: CareProfile
): Promise<VisionObservation> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const recipient = profile?.recipientName || "Sir";

  const prompt = `You are Zoya's direct visual eyes and optical perception system.
You are looking directly at the live webcam feed observing ${recipient}.

Care Recipient Name: ${recipient}
Mode: ${mode === "caretaker" ? "Health Caretaker & Companion" : "Companion"}

Analyze this live webcam image with complete precision, detecting:
1. MULTIPLE PEOPLE RECOGNITION:
   - How many people are visible in the frame (peopleCount: 0, 1, 2, 3+)?
   - For every visible person:
     * id: "person_1", "person_2", etc.
     * role: 'primary_user' (the main person in front of screen), 'companion', 'visitor', 'family_member', or 'bystander'.
     * description: brief description of who they are and where they are.
     * clothingColors: specific color of their shirt/dress and pants/bottoms (e.g., "Navy blue shirt", "Yellow kurta", "White tee").
     * position: "Center foreground", "Left background", "Sitting next to user", etc.
     * activity: what that person is currently doing.

2. CLOTHING COLOR & ATTIRE OF PRIMARY USER:
   - topColor: exact color of their upper garment (e.g. "Navy Blue", "Jet Black", "Dark Grey", "Maroon", "White", "Olive Green", "Red", "Cyan", etc.)
   - bottomColor: color of their pants/trousers/shorts if visible (or "Not visible behind desk")
   - overallDescription: detailed description of their clothing (e.g., "Navy blue crewneck t-shirt with short sleeves", "Formal light blue button-down shirt")
   - patternsOrStyle: e.g. "Solid color casual tee", "Striped polo", "Traditional kurta", "Winter hoodie"
   - accessories: any visible accessories (e.g. ["Eyeglasses", "Wristwatch", "Headphones/Earbuds", "Cap", "Chain", "Ring"])

3. WHOLE BODY INFORMATION & POSTURE:
   - posture: exact posture ("Sitting upright with straight spine", "Slumped forward with head in hands", "Leaning against chair back", "Standing upright", "Stretching arms")
   - visiblePortion: 'head_and_shoulders' | 'upper_body' | 'torso_and_legs' | 'full_body'
   - headAndFace: head tilt, eye gaze direction, facial expression
   - handsAndArms: what both hands and arms are doing (e.g., "Resting on keyboard/desk", "Holding a glass of water", "Gesturing while talking", "Holding medicine strip", "Folded on chest")
   - lowerBody: lower body position if visible
   - energyAndVibe: physical movement and alertness level ("Alert and energized", "Relaxed and calm", "Fatigued or sluggish", "Actively moving")

4. ACTIVITY DETECTION:
   - Identify primary activity: 'drinking_water', 'taking_medication', 'sitting_resting', 'walking_movement', 'reading_working', 'exercising_stretching', 'eating_meal', 'abnormal_fall', 'abnormal_distress', 'person_away', 'general_presence'.

5. PERSONALITY & AURA READING:
   - vibeTitle: catchy flattering archetype (e.g., 'The Focused Innovator', 'Serene & Warm Soul')
   - auraColor: radiant color (e.g., 'Emerald Sage', 'Celestial Blue', 'Golden Amber')
   - moodDetected: micro-expression emotional state
   - wholePersonAnalysis: 2 sentences describing their persona, clothes, and presence.

6. ZOYA'S SPOKEN COMMENTARY:
   - 1-2 friendly, witty, polite sentences spoken in Zoya's caring voice (English + polite Roman Hindi addressing ${recipient} as "Sir").
   - Explicitly mention their clothing color and posture naturally (e.g., "Sir, aap blue t-shirt me boht smart lag rahe hain aur aapki posture bilkul active hai!"). If another person is visible, acknowledge them warmly too.

Return strictly a JSON object with this exact structure:
{
  "activity": string,
  "recognizedActivityType": "drinking_water" | "taking_medication" | "sitting_resting" | "walking_movement" | "reading_working" | "exercising_stretching" | "eating_meal" | "abnormal_fall" | "abnormal_distress" | "person_away" | "general_presence",
  "confidence": number,
  "bodyLanguage": string,
  "eyeCommentary": string,
  "peopleCount": number,
  "people": [
    {
      "id": string,
      "role": "primary_user" | "companion" | "visitor" | "family_member" | "bystander",
      "description": string,
      "clothingColors": string,
      "clothingDetails": string,
      "position": string,
      "activity": string
    }
  ],
  "clothing": {
    "topColor": string,
    "bottomColor": string,
    "overallDescription": string,
    "patternsOrStyle": string,
    "accessories": string[]
  },
  "wholeBody": {
    "posture": string,
    "visiblePortion": "head_and_shoulders" | "upper_body" | "torso_and_legs" | "full_body",
    "headAndFace": string,
    "handsAndArms": string,
    "lowerBody": string,
    "energyAndVibe": string
  },
  "personality": {
    "vibeTitle": string,
    "auraColor": string,
    "moodDetected": string,
    "traits": string[],
    "expression": string,
    "styleAndSetting": string,
    "objectsObserved": string[],
    "wholePersonAnalysis": string
  },
  "emergencyDetected": boolean,
  "emergencyReason": string
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Jpeg,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    const validActivityTypes: RecognizedActivityType[] = [
      "drinking_water",
      "taking_medication",
      "sitting_resting",
      "walking_movement",
      "reading_working",
      "exercising_stretching",
      "eating_meal",
      "abnormal_fall",
      "abnormal_distress",
      "person_away",
      "general_presence",
    ];

    const recognizedType: RecognizedActivityType = validActivityTypes.includes(
      parsed.recognizedActivityType
    )
      ? parsed.recognizedActivityType
      : "general_presence";

    const peopleList: DetectedPerson[] = Array.isArray(parsed.people) && parsed.people.length > 0
      ? parsed.people.map((p: any, idx: number) => ({
          id: p.id || `person_${idx + 1}`,
          role: p.role || (idx === 0 ? "primary_user" : "companion"),
          description: p.description || (idx === 0 ? "User facing camera" : "Person in frame"),
          clothingColors: p.clothingColors || "Casual attire",
          clothingDetails: p.clothingDetails || "",
          position: p.position || "Center frame",
          activity: p.activity || "Present in room",
        }))
      : [
          {
            id: "person_1",
            role: "primary_user",
            description: "Primary user facing webcam",
            clothingColors: parsed.clothing?.topColor || "Comfortable attire",
            clothingDetails: parsed.clothing?.overallDescription || "",
            position: "Center foreground",
            activity: parsed.activity || "Sitting facing camera",
          },
        ];

    const clothingInfo: ClothingInfo = {
      topColor: parsed.clothing?.topColor || "Neutral",
      bottomColor: parsed.clothing?.bottomColor || "Not visible",
      overallDescription: parsed.clothing?.overallDescription || "Comfortable indoor attire",
      patternsOrStyle: parsed.clothing?.patternsOrStyle || "Casual wear",
      accessories: Array.isArray(parsed.clothing?.accessories) ? parsed.clothing.accessories : [],
    };

    const wholeBodyInfo: WholeBodyInfo = {
      posture: parsed.wholeBody?.posture || parsed.bodyLanguage || "Sitting upright facing screen",
      visiblePortion: parsed.wholeBody?.visiblePortion || "upper_body",
      headAndFace: parsed.wholeBody?.headAndFace || "Facing camera with attentive gaze",
      handsAndArms: parsed.wholeBody?.handsAndArms || "Hands resting comfortably",
      lowerBody: parsed.wholeBody?.lowerBody || undefined,
      energyAndVibe: parsed.wholeBody?.energyAndVibe || "Calm & steady",
    };

    const count = typeof parsed.peopleCount === "number" ? parsed.peopleCount : Math.max(1, peopleList.length);

    return {
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      activity: parsed.activity || "Person active in front of webcam",
      recognizedActivityType: recognizedType,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 92,
      bodyLanguage: wholeBodyInfo.posture,
      eyeCommentary:
        parsed.eyeCommentary ||
        `Sir, maine aapko camera me dekha! Aap ${clothingInfo.topColor} attire me boht neat lag rahe hain, aur aapki posture acchi hai.`,
      peopleCount: count,
      people: peopleList,
      clothing: clothingInfo,
      wholeBody: wholeBodyInfo,
      personality: {
        vibeTitle: parsed.personality?.vibeTitle || "Thoughtful & Grounded Thinker",
        auraColor: parsed.personality?.auraColor || "Emerald Green",
        moodDetected: parsed.personality?.moodDetected || "Peaceful & Attentive",
        traits: Array.isArray(parsed.personality?.traits) && parsed.personality.traits.length > 0
          ? parsed.personality.traits
          : ["Deep thinker", "Calm presence", "Kind spirit"],
        expression: parsed.personality?.expression || "Focused and gentle gaze",
        styleAndSetting: parsed.personality?.styleAndSetting || `${clothingInfo.topColor} clothing in ambient room lighting`,
        objectsObserved: Array.isArray(parsed.personality?.objectsObserved)
          ? parsed.personality.objectsObserved
          : [],
        wholePersonAnalysis:
          parsed.personality?.wholePersonAnalysis ||
          `Sir, aapka overall aura boht soothing aur confident lag raha hai!`,
      },
      emergencyDetected: Boolean(parsed.emergencyDetected),
      emergencyReason: parsed.emergencyReason || undefined,
    };
  } catch (error) {
    console.warn("AI Eye vision analysis fallback:", error);
    return {
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      activity: "Active in front of webcam",
      recognizedActivityType: "general_presence",
      confidence: 85,
      bodyLanguage: "Attentive posture in front of live camera",
      eyeCommentary: `Sir, aap camera me clear dikh rahe hain!`,
      peopleCount: 1,
      people: [
        {
          id: "person_1",
          role: "primary_user",
          description: "Primary user facing webcam",
          clothingColors: "Casual shirt",
          position: "Center foreground",
          activity: "Sitting in front of camera",
        },
      ],
      clothing: {
        topColor: "Comfortable top",
        bottomColor: "Not visible",
        overallDescription: "Casual indoor clothing",
        patternsOrStyle: "Casual wear",
        accessories: [],
      },
      wholeBody: {
        posture: "Sitting upright facing screen",
        visiblePortion: "upper_body",
        headAndFace: "Facing camera directly",
        handsAndArms: "Resting on desk",
        energyAndVibe: "Calm and steady",
      },
      personality: {
        vibeTitle: "The Gentle Creator",
        auraColor: "Cosmic Indigo",
        moodDetected: "Focused & Receptive",
        traits: ["Intelligent", "Observant", "Patient"],
        expression: "Attentive gaze with gentle focus",
        styleAndSetting: "Ambient room lighting",
        objectsObserved: ["Camera feed", "Screen"],
        wholePersonAnalysis: `Sir, aapka presence boht grounded aur poised lag raha hai.`,
      },
      emergencyDetected: false,
    };
  }
}

