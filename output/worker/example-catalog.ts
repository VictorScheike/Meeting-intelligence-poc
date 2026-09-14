import nordeaTranscript from "./example-transcripts/nordea.txt?raw";
import paymentsTranscript from "./example-transcripts/payments.txt?raw";
import roadmapTranscript from "./example-transcripts/roadmap.txt?raw";

export const EXAMPLE_IDS = ["roadmap", "nordea", "payments"] as const;

export type ExampleId = (typeof EXAMPLE_IDS)[number];

const TRANSCRIPTS: Record<ExampleId, string> = {
  roadmap: roadmapTranscript,
  nordea: nordeaTranscript,
  payments: paymentsTranscript,
};

export function isExampleId(value: string): value is ExampleId {
  return EXAMPLE_IDS.some((id) => id === value);
}

export function getExampleTranscript(id: ExampleId): string {
  return TRANSCRIPTS[id];
}
