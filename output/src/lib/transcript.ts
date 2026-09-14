import {
  TRANSCRIPT_MAX_CHARS,
  TRANSCRIPT_MIN_CHARS,
} from "./constants.ts";

const TIMESTAMP_PATTERN = /\[\d{1,2}:\d{2}(?::\d{2})?\]/;
const SPEAKER_PATTERN =
  /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' .-]{0,78}:/m;

export type TranscriptValidationError =
  | "too_short"
  | "too_long"
  | "nul_characters"
  | "control_characters"
  | "not_transcript_like";

export type TranscriptValidationResult =
  | { ok: true }
  | { ok: false; error: TranscriptValidationError; message: string };

function controlCharacterRatio(text: string): number {
  if (text.length === 0) {
    return 0;
  }

  let bad = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    const allowedWhitespace = code === 9 || code === 10 || code === 13;
    const isControl = code < 32 || code === 127;
    if (isControl && !allowedWhitespace) {
      bad += 1;
    }
  }

  return bad / text.length;
}

export function validateTranscript(text: string): TranscriptValidationResult {
  if (text.includes("\u0000")) {
    return {
      ok: false,
      error: "nul_characters",
      message: "The file contains invalid binary characters.",
    };
  }

  if (text.length < TRANSCRIPT_MIN_CHARS) {
    return {
      ok: false,
      error: "too_short",
      message: "The transcript is too short to analyse.",
    };
  }

  if (text.length > TRANSCRIPT_MAX_CHARS) {
    return {
      ok: false,
      error: "too_long",
      message: "The transcript exceeds the 100,000 character limit.",
    };
  }

  if (controlCharacterRatio(text) > 0.05) {
    return {
      ok: false,
      error: "control_characters",
      message: "The file does not look like readable meeting text.",
    };
  }

  if (!TIMESTAMP_PATTERN.test(text) && !SPEAKER_PATTERN.test(text)) {
    return {
      ok: false,
      error: "not_transcript_like",
      message:
        "This file does not look like a meeting transcript. Include speaker names or timestamps.",
    };
  }

  return { ok: true };
}

export function isTxtFileName(name: string): boolean {
  return name.toLowerCase().endsWith(".txt");
}
