import { describe, expect, it } from "vitest";
import {
  analyzeRequestSchema,
  loginRequestSchema,
  parseModelOutput,
} from "./report-schema.ts";

describe("request validation", () => {
  it("accepts a password payload and rejects unknown keys", () => {
    expect(loginRequestSchema.parse({ password: "secret" })).toEqual({
      password: "secret",
    });
    expect(loginRequestSchema.safeParse({ password: "secret", extra: true }).success).toBe(
      false,
    );
  });

  it("accepts a transcript payload and rejects unknown keys", () => {
    expect(analyzeRequestSchema.parse({ transcript: "hello" })).toEqual({
      transcript: "hello",
    });
    expect(
      analyzeRequestSchema.safeParse({ transcript: "hello", model: "gpt" }).success,
    ).toBe(false);
  });
});

describe("model output validation", () => {
  it("normalises a successful meeting report", () => {
    const result = parseModelOutput({
      ok: true,
      error: null,
      title: "Roadmap",
      date: "15 January 2024",
      meetingType: "internal",
      shortSummary: "A concise summary of the meeting.",
      conclusion: "The organisation will pursue the framework approach.",
      people: [
        {
          name: "Line Petersen",
          nextSteps: [{ text: "Share a detailed timeline", due: "end of week" }],
        },
        {
          name: "Thomas Nielsen",
          nextSteps: [{ text: "Document mobile use cases", due: null }],
        },
      ],
    });

    expect(result).toEqual({
      ok: true,
      title: "Roadmap",
      date: "15 January 2024",
      meetingType: "internal",
      shortSummary: "A concise summary of the meeting.",
      conclusion: "The organisation will pursue the framework approach.",
      people: [
        {
          name: "Line Petersen",
          nextSteps: [{ text: "Share a detailed timeline", due: "end of week" }],
        },
        {
          name: "Thomas Nielsen",
          nextSteps: [{ text: "Document mobile use cases" }],
        },
      ],
    });
  });

  it("accepts the not_a_transcript result", () => {
    expect(
      parseModelOutput({
        ok: false,
        error: "not_a_transcript",
        title: null,
        date: null,
        meetingType: null,
        shortSummary: null,
        conclusion: null,
        people: null,
      }),
    ).toEqual({ ok: false, error: "not_a_transcript" });
  });

  it("rejects malformed model output", () => {
    expect(() =>
      parseModelOutput({
        ok: true,
        error: null,
        title: "",
        date: "15 January 2024",
        meetingType: "internal",
        shortSummary: "Summary",
        conclusion: "Conclusion",
        people: [],
      }),
    ).toThrow("MODEL_OUTPUT_INVALID");
  });
});
