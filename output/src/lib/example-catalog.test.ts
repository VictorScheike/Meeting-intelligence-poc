import { describe, expect, it } from "vitest";
import {
  EXAMPLE_IDS,
  getExampleTranscript,
  isExampleId,
} from "../../worker/example-catalog.ts";

describe("worker example transcripts", () => {
  it("recognises the three example ids", () => {
    expect(isExampleId("roadmap")).toBe(true);
    expect(isExampleId("nordea")).toBe(true);
    expect(isExampleId("payments")).toBe(true);
    expect(isExampleId("other")).toBe(false);
  });

  it("bundles a real transcript for every example", () => {
    for (const id of EXAMPLE_IDS) {
      const text = getExampleTranscript(id);
      expect(text.length).toBeGreaterThan(400);
      expect(text).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
    }
  });
});
