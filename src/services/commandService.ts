import { CareProfile, Medication, MedicalVitals, MedicalRecordEntry } from "../types/caretaker";

export interface CommandResult {
  action: string;
  url?: string;
  isBrowserAction: boolean;
  mediaType?: "youtube" | "google";
  searchQuery?: string;
  caretakerAction?:
    | "emergency"
    | "log_water"
    | "log_medication"
    | "start_breathing"
    | "call_doctor"
    | "call_emergency"
    | "check_meds"
    | "check_vitals"
    | "open_webcam"
    | "close_webcam"
    | "shrink_webcam"
    | "read_personality"
    | "scan_activity"
    | "medical_advice";
  payload?: any;
}

export function processCommand(
  command: string,
  mode: "companion" | "caretaker" = "companion",
  context?: {
    profile?: CareProfile;
    medications?: Medication[];
    waterGlasses?: number;
    waterTarget?: number;
    vitals?: MedicalVitals;
    medicalRecords?: MedicalRecordEntry[];
  }
): CommandResult {
  const lowerCmd = command.toLowerCase().trim();

  // 0. MEDICAL ADVICE & CLINICAL QUERIES
  if (
    lowerCmd.includes("medical advice") ||
    lowerCmd.includes("health advice") ||
    lowerCmd.includes("doctor advice") ||
    lowerCmd.includes("medical info") ||
    lowerCmd.includes("medical reference") ||
    lowerCmd.includes("clinical guide") ||
    lowerCmd.includes("first aid") ||
    lowerCmd.includes("check vitals") ||
    lowerCmd.includes("check my vitals") ||
    lowerCmd.includes("check my bp") ||
    lowerCmd.includes("blood pressure advice") ||
    lowerCmd.includes("blood sugar advice") ||
    lowerCmd.includes("sugar advice") ||
    lowerCmd.includes("can i take medicine") ||
    lowerCmd.includes("drug interaction") ||
    lowerCmd.includes("drug safety") ||
    lowerCmd.includes("paracetamol") ||
    lowerCmd.includes("ibuprofen") ||
    lowerCmd.includes("amoxicillin") ||
    lowerCmd.includes("symptom check") ||
    lowerCmd.includes("tabiyat kharab") ||
    lowerCmd.includes("tabiyat theek nahi") ||
    lowerCmd.includes("dawai ka asar") ||
    lowerCmd.includes("sar dard") ||
    lowerCmd.includes("headache") ||
    lowerCmd.includes("dizziness") ||
    lowerCmd.includes("chakkar")
  ) {
    return {
      action: "Ji Sir, main aapki clinical profile aur current vitals ke anusaar comprehensive medical advice aur clinical knowledge window open kar rahi hoon.",
      isBrowserAction: false,
      caretakerAction: "medical_advice",
      payload: { query: command },
    };
  }

  // 0. WEBCAM & AI EYE PERCEPTION COMMANDS
  if (
    lowerCmd.includes("make camera small") ||
    lowerCmd.includes("make cam small") ||
    lowerCmd.includes("make camera smaller") ||
    lowerCmd.includes("make cam more small") ||
    lowerCmd.includes("shrink camera") ||
    lowerCmd.includes("small camera") ||
    lowerCmd.includes("mini camera") ||
    lowerCmd.includes("minimize camera") ||
    lowerCmd.includes("camera chhota karo") ||
    lowerCmd.includes("chhota camera")
  ) {
    return {
      action: "Ji Sir, maine webcam aur AI Eye window ko bilkul compact aur small size me set kar diya hai.",
      isBrowserAction: false,
      caretakerAction: "shrink_webcam",
    };
  }

  // 0. WEBCAM & LIVE VISION COMMANDS
  if (
    lowerCmd.includes("read my personality") ||
    lowerCmd.includes("analyze my personality") ||
    lowerCmd.includes("what is my vibe") ||
    lowerCmd.includes("check my vibe") ||
    lowerCmd.includes("tell my personality") ||
    lowerCmd.includes("tell about my personality") ||
    lowerCmd.includes("look at me") ||
    lowerCmd.includes("see me") ||
    lowerCmd.includes("mera vibe kaisa hai") ||
    lowerCmd.includes("meri personality") ||
    lowerCmd.includes("what do you see in the camera") ||
    lowerCmd.includes("what do you see") ||
    lowerCmd.includes("what am i doing") ||
    lowerCmd.includes("can you see me") ||
    lowerCmd.includes("camera me dekho") ||
    lowerCmd.includes("mujhe dekho") ||
    lowerCmd.includes("main kya kar raha hoon") ||
    lowerCmd.includes("meri posture kaisi hai") ||
    lowerCmd.includes("how is my posture") ||
    lowerCmd.includes("what clothes") ||
    lowerCmd.includes("what am i wearing") ||
    lowerCmd.includes("clothes color") ||
    lowerCmd.includes("cloth color") ||
    lowerCmd.includes("cloths colour") ||
    lowerCmd.includes("clothing color") ||
    lowerCmd.includes("shirt color") ||
    lowerCmd.includes("mere kapde") ||
    lowerCmd.includes("kapdo ka color") ||
    lowerCmd.includes("kapde ka color") ||
    lowerCmd.includes("who else is here") ||
    lowerCmd.includes("who is in the room") ||
    lowerCmd.includes("other people") ||
    lowerCmd.includes("koi aur hai") ||
    lowerCmd.includes("is someone with me") ||
    lowerCmd.includes("whole body") ||
    lowerCmd.includes("full body") ||
    lowerCmd.includes("body language")
  ) {
    // Open/ensure camera is visible, but let Zoya generate dynamic live-vision response
    return {
      action: "",
      isBrowserAction: false,
      caretakerAction: "open_webcam",
    };
  }

  if (
    lowerCmd.includes("open camera") ||
    lowerCmd.includes("open webcam") ||
    lowerCmd.includes("turn on camera") ||
    lowerCmd.includes("turn on webcam") ||
    lowerCmd.includes("show camera") ||
    lowerCmd.includes("start camera") ||
    lowerCmd.includes("start webcam") ||
    lowerCmd.includes("camera on") ||
    lowerCmd.includes("camera chalao") ||
    lowerCmd.includes("webcam chalao")
  ) {
    return {
      action: "Ji Sir, maine live camera start kar diya hai aur ab main aapko live dekh rahi hoon!",
      isBrowserAction: false,
      caretakerAction: "open_webcam",
    };
  }

  if (
    lowerCmd.includes("close camera") ||
    lowerCmd.includes("close webcam") ||
    lowerCmd.includes("turn off camera") ||
    lowerCmd.includes("turn off webcam") ||
    lowerCmd.includes("hide camera") ||
    lowerCmd.includes("hide webcam") ||
    lowerCmd.includes("stop camera") ||
    lowerCmd.includes("camera band")
  ) {
    return {
      action: "Webcam window hide kar di gayi hai, Sir.",
      isBrowserAction: false,
      caretakerAction: "close_webcam",
    };
  }

  // 1. EMERGENCY TRIGGERS (Recognized in both modes, especially in caretaker mode)
  const emergencyKeywords = [
    "emergency",
    "bachao",
    "help me",
    "i fell down",
    "i have fallen",
    "i fell",
    "chest pain",
    "heart attack",
    "can't breathe",
    "cannot breathe",
    "call 112",
    "call 911",
    "call ambulance",
    "i am dying",
    "severe pain",
    "madad karo",
  ];

  if (emergencyKeywords.some((kw) => lowerCmd.includes(kw))) {
    const contact = context?.profile?.emergencyContactName || "Emergency Contact";
    return {
      action: `Sir, please bilkul mat ghabraiye! Aaram se baithiye aur koi achanak movement mat kijiye. Main turant ${contact} aur emergency helpline ko call laga rahi hoon. Main yahi aapke paas hoon!`,
      isBrowserAction: false,
      caretakerAction: "emergency",
      payload: { reason: command },
    };
  }

  // 2. CARETAKER-SPECIFIC COMMANDS
  if (mode === "caretaker") {
    // A. Medication Logging & Status
    if (
      lowerCmd.includes("took my medicine") ||
      lowerCmd.includes("taken my medicine") ||
      lowerCmd.includes("dawai le li") ||
      lowerCmd.includes("medicine kha li") ||
      lowerCmd.includes("mark medicine") ||
      lowerCmd.includes("log medicine")
    ) {
      return {
        action: "Wah Sir, boht badhiya! Maine aapki aaj ki dawai mark kar di hai. Samay par dawai lena boht acchi aadat hai!",
        isBrowserAction: false,
        caretakerAction: "log_medication",
      };
    }

    if (
      lowerCmd.includes("what medicine") ||
      lowerCmd.includes("which medicine") ||
      lowerCmd.includes("kounsi dawai") ||
      lowerCmd.includes("medicines today") ||
      lowerCmd.includes("check medicines") ||
      lowerCmd.includes("check my meds") ||
      lowerCmd.includes("check meds") ||
      lowerCmd.includes("remind me my medicine") ||
      lowerCmd.includes("remind medicine") ||
      lowerCmd.includes("medicine reminder") ||
      lowerCmd.includes("dawai bachi hai") ||
      lowerCmd.includes("meri dawai") ||
      lowerCmd.includes("dawai ka time")
    ) {
      const pending = (context?.medications || []).filter((m) => !m.takenToday);
      if (pending.length === 0) {
        return {
          action: "Aapne aaj ki saari scheduled dawaiyaan le li hain, Sir! Boht shabash!",
          isBrowserAction: false,
          caretakerAction: "check_meds",
        };
      }
      const list = pending.map((m) => `${m.name} (${m.time})`).join(", ");
      return {
        action: `Sir, aapki baaki dawaiyaan hain: ${list}. Kripya inko samay par zaroor le lijiyega.`,
        isBrowserAction: false,
        caretakerAction: "check_meds",
      };
    }

    // B. Hydration / Water
    if (
      lowerCmd.includes("drank water") ||
      lowerCmd.includes("paani pee liya") ||
      lowerCmd.includes("log water") ||
      lowerCmd.includes("one glass of water") ||
      lowerCmd.includes("glass of water") ||
      lowerCmd.includes("ek glass paani")
    ) {
      const current = (context?.waterGlasses || 0) + 1;
      const target = context?.waterTarget || 8;
      return {
        action: `Arey wah, boht accha kiya! 1 glass paani note kar liya hai. Aaj aapne ${current} of ${target} glasses paani pee liya hai. Aise hi hydrated rahiyega!`,
        isBrowserAction: false,
        caretakerAction: "log_water",
      };
    }

    // C. Breathing / Anxiety / Calmness
    if (
      lowerCmd.includes("breathing") ||
      lowerCmd.includes("deep breath") ||
      lowerCmd.includes("calm down") ||
      lowerCmd.includes("anxious") ||
      lowerCmd.includes("panic") ||
      lowerCmd.includes("stress") ||
      lowerCmd.includes("ghabrahat") ||
      lowerCmd.includes("saans lene")
    ) {
      return {
        action: "Sir, mere saath aaram se baithiye. Chaliye 1 minute ke liye deep breathing exercise karte hain. Dheere se saans andar lijiye... aur aaram se bahar...",
        isBrowserAction: false,
        caretakerAction: "start_breathing",
      };
    }

    // D. Call Doctor
    if (
      lowerCmd.includes("call doctor") ||
      lowerCmd.includes("call my doctor") ||
      lowerCmd.includes("doctor ko call") ||
      lowerCmd.includes("doctor ka number")
    ) {
      const docName = context?.profile?.doctorName || "Doctor";
      const docPhone = context?.profile?.doctorPhone || "";
      return {
        action: `Ji Sir, ${docName} ko connect kar rahi hoon (${docPhone}). Aap aaram se baithiye.`,
        url: docPhone ? `tel:${docPhone.replace(/\s+/g, "")}` : undefined,
        isBrowserAction: Boolean(docPhone),
        caretakerAction: "call_doctor",
      };
    }

    // E. Call Emergency / Family Contact
    if (
      lowerCmd.includes("call emergency contact") ||
      lowerCmd.includes("call family") ||
      lowerCmd.includes("call my son") ||
      lowerCmd.includes("call my daughter") ||
      lowerCmd.includes("call beta")
    ) {
      const contactName = context?.profile?.emergencyContactName || "Emergency Contact";
      const contactPhone = context?.profile?.emergencyContactPhone || "";
      return {
        action: `Ji Sir, main turant ${contactName} ko call laga rahi hoon. Aap bilkul chinta mat kijiye.`,
        url: contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined,
        isBrowserAction: Boolean(contactPhone),
        caretakerAction: "call_emergency",
      };
    }
  }

  // 3. GENERAL BROWSING & ENTERTAINMENT COMMANDS
  // A. YouTube Video Play / Search:
  // e.g. "play hanuman chalisa on youtube", "play song", "play video", "youtube play old songs", "youtube chalao", "play arijit singh", "watch video"
  const isYouTubeIntent =
    lowerCmd.includes("youtube") ||
    lowerCmd.startsWith("play video") ||
    lowerCmd.startsWith("watch video") ||
    lowerCmd.startsWith("play song") ||
    lowerCmd.startsWith("play music") ||
    lowerCmd.startsWith("play ");

  if (isYouTubeIntent && !lowerCmd.includes("spotify")) {
    let cleanQuery = lowerCmd
      .replace(/^play\s+video\s+(?:of\s+)?/i, "")
      .replace(/^watch\s+video\s+(?:of\s+)?/i, "")
      .replace(/^play\s+song\s+(?:of\s+)?/i, "")
      .replace(/^play\s+music\s+(?:of\s+)?/i, "")
      .replace(/^play\s+/i, "")
      .replace(/^search\s+/i, "")
      .replace(/^open\s+/i, "")
      .replace(/\s+on\s+youtube$/i, "")
      .replace(/\s+in\s+youtube$/i, "")
      .replace(/\s+video\s+play\s+karo$/i, "")
      .replace(/\s+video\s+chalao$/i, "")
      .replace(/\s+chalao$/i, "")
      .replace(/^youtube\s+(?:par\s+|pe\s+)?(?:play\s+|chalao\s+|dikhaye\s+|dikhao\s+)?/i, "")
      .replace(/(?:chalao|dikhaye|dikhao|dekho|suno)\s+youtube\s+par$/i, "")
      .trim();

    if (!cleanQuery || cleanQuery === "youtube") {
      cleanQuery = "trending relaxing hindi music";
    }

    const encodedQuery = encodeURIComponent(cleanQuery);
    const responseAction =
      mode === "caretaker"
        ? `Ji Sir, YouTube par aapke liye "${cleanQuery}" chala rahi hoon. Aaram se video ka anand lijiye!`
        : `Playing "${cleanQuery}" on YouTube for you.`;

    return {
      action: responseAction,
      url: `https://www.youtube.com/results?search_query=${encodedQuery}`,
      isBrowserAction: true,
      mediaType: "youtube",
      searchQuery: cleanQuery,
    };
  }

  // B. Google Search:
  // e.g. "google search weather", "search on google best diet", "google par search karo", "google what is the blood pressure range", "search what is diabetes"
  const isGoogleSearchIntent =
    lowerCmd.startsWith("google ") ||
    lowerCmd.startsWith("google search ") ||
    lowerCmd.startsWith("search google for ") ||
    lowerCmd.startsWith("search on google ") ||
    lowerCmd.startsWith("search google ") ||
    lowerCmd.includes("on google") ||
    lowerCmd.includes("in google") ||
    lowerCmd.includes("google par search") ||
    lowerCmd.includes("google pe search") ||
    lowerCmd.includes("google par dhoondo") ||
    lowerCmd.startsWith("search for ") ||
    lowerCmd.startsWith("search ");

  if (isGoogleSearchIntent) {
    let cleanQuery = lowerCmd
      .replace(/^google\s+search\s+(?:for\s+)?/i, "")
      .replace(/^search\s+google\s+(?:for\s+)?/i, "")
      .replace(/^search\s+on\s+google\s+(?:for\s+)?/i, "")
      .replace(/^search\s+for\s+/i, "")
      .replace(/^search\s+/i, "")
      .replace(/^google\s+/i, "")
      .replace(/\s+on\s+google$/i, "")
      .replace(/\s+in\s+google$/i, "")
      .replace(/\s+google\s+par\s+search\s+karo$/i, "")
      .replace(/\s+google\s+pe\s+dhoondho$/i, "")
      .replace(/\s+google\s+par\s+dhoondo$/i, "")
      .trim();

    if (!cleanQuery) {
      cleanQuery = "latest health tips and news";
    }

    const encodedQuery = encodeURIComponent(cleanQuery);
    const responseAction =
      mode === "caretaker"
        ? `Ji Sir, Google par "${cleanQuery}" search kar rahi hoon. Saari jaankari aapke saamne hai.`
        : `Searching Google for "${cleanQuery}".`;

    return {
      action: responseAction,
      url: `https://www.google.com/search?q=${encodedQuery}`,
      isBrowserAction: true,
      mediaType: "google",
      searchQuery: cleanQuery,
    };
  }

  // C. General Website Browsing: "Open [website name]"
  const openMatch = lowerCmd.match(/^open\s+(.+)$/);
  if (
    openMatch &&
    !lowerCmd.includes("youtube") &&
    !lowerCmd.includes("spotify") &&
    !lowerCmd.includes("google")
  ) {
    let website = openMatch[1].trim().replace(/\s+/g, "");
    if (!website.includes(".")) {
      website += ".com";
    }
    const responseAction =
      mode === "caretaker"
        ? `Ji Sir, aapke liye ${openMatch[1]} open kar rahi hoon.`
        : `Opening ${openMatch[1]} for you, ugh.`;
    return {
      action: responseAction,
      url: `https://www.${website}`,
      isBrowserAction: true,
    };
  }

  // D. Media Search: "Search [query] on Spotify"
  const spotifyMatch = lowerCmd.match(/^search\s+(.+?)\s+on\s+spotify$/);
  if (spotifyMatch) {
    const query = encodeURIComponent(spotifyMatch[1].trim());
    const responseAction =
      mode === "caretaker"
        ? `Spotify par ${spotifyMatch[1]} dhoondh rahi hoon, Sir.`
        : `Searching ${spotifyMatch[1]} on Spotify. Hope it's a banger.`;
    return {
      action: responseAction,
      url: `https://open.spotify.com/search/${query}`,
      isBrowserAction: true,
    };
  }

  // WhatsApp Web: "Send a WhatsApp message to [number] saying [message]"
  const waMatch = lowerCmd.match(
    /^send\s+a\s+whatsapp\s+message\s+to\s+([\d\+\s]+)\s+saying\s+(.+)$/
  );
  if (waMatch) {
    const number = waMatch[1].replace(/\s+/g, "");
    const message = encodeURIComponent(waMatch[2].trim());
    const responseAction =
      mode === "caretaker"
        ? `Aapka WhatsApp sandesh bhej rahi hoon, Sir.`
        : `Sending your message. Let's hope they reply, Nitin.`;
    return {
      action: responseAction,
      url: `https://web.whatsapp.com/send?phone=${number}&text=${message}`,
      isBrowserAction: true,
    };
  }

  return { action: "", isBrowserAction: false };
}
