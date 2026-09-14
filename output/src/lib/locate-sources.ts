export type TextSpan = {
  start: number;
  end: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "will",
  "this",
  "that",
  "have",
  "has",
]);

function significantWords(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-zà-öø-ÿ0-9]+/i)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
}

function unwrapQuote(value: string): string {
  return value.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
}

function foldQuotes(value: string): string {
  return value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function findExactInsensitive(haystack: string, needle: string): TextSpan | null {
  const trimmed = unwrapQuote(needle);
  if (trimmed.length < 6) {
    return null;
  }
  const hay = foldQuotes(haystack).toLowerCase();
  const need = foldQuotes(trimmed).toLowerCase();
  const index = hay.indexOf(need);
  if (index >= 0) {
    return { start: index, end: index + need.length };
  }

  const clipLength = Math.min(need.length, 96);
  const clip = need.slice(0, clipLength);
  if (clip.length < 12) {
    return null;
  }
  const clipIndex = hay.indexOf(clip);
  if (clipIndex < 0) {
    return null;
  }
  return { start: clipIndex, end: clipIndex + clip.length };
}

function lineSpans(haystack: string): TextSpan[] {
  const spans: TextSpan[] = [];
  let start = 0;
  const parts = haystack.split("\n");
  for (const line of parts) {
    const end = start + line.length;
    if (line.trim().length > 0) {
      spans.push({ start, end });
    }
    start = end + 1;
  }
  return spans;
}

function scoreLine(
  line: string,
  words: string[],
  personName?: string,
): number {
  const lower = line.toLowerCase();
  let score = words.filter((word) => lower.includes(word)).length;
  const firstName = personName?.split(/\s+/)[0]?.toLowerCase();
  if (firstName && firstName.length >= 3 && lower.includes(firstName)) {
    score += 2;
  }
  return score;
}

function fallbackLineSpans(
  haystack: string,
  taskText: string,
  personName?: string,
): TextSpan[] {
  const words = significantWords(taskText);
  if (words.length === 0) {
    return [];
  }
  const matches = lineSpans(haystack)
    .map((span) => ({
      span,
      score: scoreLine(haystack.slice(span.start, span.end), words, personName),
    }))
    .filter((entry) => entry.score >= (words.length >= 3 ? 2 : 1))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((entry) => entry.span);

  return mergeSpans(matches);
}

export function mergeSpans(spans: TextSpan[]): TextSpan[] {
  const valid = spans
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start);
  const merged: TextSpan[] = [];
  for (const span of valid) {
    const last = merged[merged.length - 1];
    if (!last || span.start > last.end) {
      merged.push({ ...span });
    } else {
      last.end = Math.max(last.end, span.end);
    }
  }
  return merged;
}

export function locateSources(haystack: string, needles: string[]): TextSpan[] {
  const spans: TextSpan[] = [];
  for (const needle of needles) {
    const found = findExactInsensitive(haystack, needle);
    if (found) {
      spans.push(found);
    }
  }
  return mergeSpans(spans);
}

export function locateTaskSources(
  haystack: string,
  input: {
    text: string;
    sources?: string[];
    personName?: string;
  },
): TextSpan[] {
  const quoteSpans = locateSources(haystack, input.sources ?? []);
  if (quoteSpans.length > 0) {
    return quoteSpans;
  }
  const fromTask = locateSources(haystack, [input.text]);
  if (fromTask.length > 0) {
    return fromTask;
  }
  return fallbackLineSpans(haystack, input.text, input.personName);
}

export function splitHighlighted(
  text: string,
  highlights: TextSpan[],
): Array<{ text: string; highlight: boolean }> {
  const spans = mergeSpans(highlights).filter(
    (span) => span.start >= 0 && span.end <= text.length,
  );
  if (spans.length === 0) {
    return [{ text, highlight: false }];
  }

  const parts: Array<{ text: string; highlight: boolean }> = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) {
      parts.push({ text: text.slice(cursor, span.start), highlight: false });
    }
    parts.push({ text: text.slice(span.start, span.end), highlight: true });
    cursor = span.end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlight: false });
  }
  return parts;
}
