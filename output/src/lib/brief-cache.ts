import { isExampleId, type ExampleId } from "./examples.ts";
import type { MeetingReport } from "./report-schema.ts";

const BRIEFS_KEY = "mi-cached-briefs";
const MAX_BRIEFS = 12;

export type CachedBrief = {
  id: string;
  source: "example" | "upload";
  label: string;
  fileName?: string;
  exampleId?: ExampleId;
  transcript?: string;
  createdAt: number;
  report: MeetingReport;
};

function readAll(): CachedBrief[] {
  try {
    const raw = window.localStorage.getItem(BRIEFS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isCachedBrief);
  } catch {
    return [];
  }
}

function isCachedBrief(value: unknown): value is CachedBrief {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const entry = value as CachedBrief;
  const exampleIdOk =
    entry.exampleId === undefined || isExampleId(entry.exampleId);
  const transcriptOk =
    entry.transcript === undefined || typeof entry.transcript === "string";
  return (
    typeof entry.id === "string" &&
    (entry.source === "example" || entry.source === "upload") &&
    typeof entry.label === "string" &&
    typeof entry.createdAt === "number" &&
    typeof entry.report === "object" &&
    entry.report !== null &&
    entry.report.ok === true &&
    exampleIdOk &&
    transcriptOk
  );
}

function writeAll(entries: CachedBrief[]): void {
  try {
    window.localStorage.setItem(BRIEFS_KEY, JSON.stringify(entries.slice(0, MAX_BRIEFS)));
  } catch {
    // Private browsing or quota errors should not break analysis.
  }
}

export function listCachedBriefs(): CachedBrief[] {
  return readAll();
}

export function listCachedUploads(): CachedBrief[] {
  return readAll().filter((entry) => entry.source === "upload");
}

export function saveCachedBrief(
  entry: Omit<CachedBrief, "id" | "createdAt">,
): CachedBrief {
  const saved: CachedBrief = {
    ...entry,
    id: `${entry.source}:${entry.label}:${Date.now()}`,
    createdAt: Date.now(),
  };
  writeAll([saved, ...readAll().filter((item) => item.id !== saved.id)]);
  return saved;
}
