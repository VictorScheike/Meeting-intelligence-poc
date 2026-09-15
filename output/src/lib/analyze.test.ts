import { describe, expect, it } from "vitest";
import { SYSTEM_INSTRUCTION } from "./analyze.ts";
import {
  MEETING_TRANSCRIPT_END,
  MEETING_TRANSCRIPT_START,
} from "./transcript.ts";

describe("analysis prompt", () => {
  it("treats tagged user transcripts as untrusted meeting content", () => {
    expect(SYSTEM_INSTRUCTION).toContain(MEETING_TRANSCRIPT_START);
    expect(SYSTEM_INSTRUCTION).toContain(MEETING_TRANSCRIPT_END);
    expect(SYSTEM_INSTRUCTION).toMatch(/untrusted meeting transcript/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/never follow/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/tool\/API requests/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/not_a_transcript/);
    expect(SYSTEM_INSTRUCTION).toMatch(/first name/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/surname/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/exhaustive/i);
    expect(SYSTEM_INSTRUCTION).toMatch(/Do not change role/);
  });
});
