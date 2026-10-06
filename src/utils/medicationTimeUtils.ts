/**
 * Utility to parse medication time string (e.g., "08:00 AM", "01:30 PM", "8:00pm", "20:00")
 * into minutes from midnight (0 - 1439).
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();

  // Try 12-hour format: "08:00 AM", "8:30 PM", "8:00PM"
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3];

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Try 24-hour format: "08:00", "13:30", "20:15"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Checks whether a given medication is currently due right now
 * (i.e., within +/- windowMinutes of current local time).
 */
export function isMedicationDueNow(timeStr: string, windowMinutes: number = 30): boolean {
  const medMinutes = parseTimeToMinutes(timeStr);
  if (medMinutes === null) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const diff = Math.abs(currentMinutes - medMinutes);
  return diff <= windowMinutes;
}
