// Choosing a voice for "Listen". Pure functions so they can be unit-tested.
//
// PRIVACY: some browser voices ("online", "natural" cloud voices, "Google ...") send the text to
// Google or Microsoft to be spoken. The book is for children and promises nothing leaves the
// device, so by default ONLY voices that run on the device (localService === true) are used.
// An online voice is used only if the student picks it themselves, and is labelled as such.

/** A score for how natural a voice is likely to sound; -1 means "not English, do not offer". */
export function rankVoice(v) {
  const n = String(v.name).toLowerCase();
  let score = 0;
  if (/^en[-_]gb/i.test(v.lang)) score += 30;
  else if (/^en[-_](au|ie|nz|za)/i.test(v.lang)) score += 15;
  else if (/^en/i.test(v.lang)) score += 8;
  else return -1;
  if (/natural|neural/.test(n)) score += 40;
  if (/premium|enhanced/.test(n)) score += 40;
  if (/siri|samantha|daniel|kate|serena|oliver|martha|sonia|libby|ryan/.test(n)) score += 25;
  if (/compact|espeak|zira|david|mark|hazel|desktop/.test(n)) score -= 20;
  return score;
}

/** True when speaking with this voice may send the text off the device. */
export function isOnline(v) {
  return v.localService === false || /\bonline\b|google/i.test(String(v.name));
}

/** The voice to use: the student's own choice if it still exists, else the best on-device voice, else null (browser default). */
export function bestVoice(voices, prefName = '') {
  if (prefName) {
    const chosen = voices.find((v) => v.name === prefName);
    if (chosen) return chosen;
  }
  const local = voices.filter((v) => !isOnline(v) && rankVoice(v) >= 0);
  return local.map((v) => [rankVoice(v), v]).sort((a, b) => b[0] - a[0])[0]?.[1] ?? null;
}

/** Label for the voice picker; online voices say so. */
export function voiceLabel(v) {
  return isOnline(v) ? `${v.name} (online: the text is sent to the voice company)` : `${v.name} (on this device)`;
}
