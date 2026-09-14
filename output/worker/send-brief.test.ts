import { describe, expect, it } from "vitest";
import { DEFAULT_RESEND_TEMPLATE_ID } from "../src/lib/email.ts";
import type { MeetingReport } from "../src/lib/report-schema.ts";
import { buildBriefEmailPayload } from "./send-brief.ts";

const report: MeetingReport = {
  ok: true,
  title: "Q1 2024 Product Roadmap Planning",
  date: "15 January 2024",
  meetingType: "internal",
  shortSummary: "The team locked Q1 priorities.",
  conclusion: "Build an integration framework first.",
  people: [
    {
      name: "Line Petersen",
      nextSteps: [{ text: "Share a detailed timeline", due: "end of week" }],
    },
  ],
};

describe("buildBriefEmailPayload", () => {
  it("sends through the stored Resend template instead of inline HTML", () => {
    const payload = buildBriefEmailPayload({
      from: "Meeting Intelligence <hello@example.com>",
      templateId: DEFAULT_RESEND_TEMPLATE_ID,
      request: {
        to: ["delivered@resend.dev"],
        report,
        sendId: "send-brief-1",
      },
    });

    expect(payload.template.id).toBe("meeting-brief");
    expect(payload.template.variables.TITLE).toBe(report.title);
    expect(payload.subject).toBe("Meeting brief: Q1 2024 Product Roadmap Planning");
    expect(payload).not.toHaveProperty("html");
    expect(payload).not.toHaveProperty("text");
    expect(payload).not.toHaveProperty("react");
  });

  it("overrides the subject for a person checklist", () => {
    const payload = buildBriefEmailPayload({
      from: "Meeting Intelligence <hello@example.com>",
      replyTo: "hello@example.com",
      templateId: DEFAULT_RESEND_TEMPLATE_ID,
      request: {
        to: ["delivered@resend.dev"],
        report,
        personName: "Line Petersen",
        sendId: "send-brief-2",
      },
    });

    expect(payload.subject).toContain("Line Petersen");
    expect(payload.replyTo).toBe("hello@example.com");
    expect(payload.template.variables.NEXT_STEPS_HTML).toContain("Share a detailed timeline");
    expect(payload.tags).toEqual([{ name: "email_type", value: "meeting_brief_person" }]);
  });

  it("limits a next-step send to that one task", () => {
    const payload = buildBriefEmailPayload({
      from: "Meeting Intelligence <hello@example.com>",
      templateId: DEFAULT_RESEND_TEMPLATE_ID,
      request: {
        to: ["delivered@resend.dev"],
        report,
        personName: "Line Petersen",
        stepText: "Share a detailed timeline",
        sendId: "send-brief-3",
      },
    });

    expect(payload.template.id).toBe("meeting-brief");
    expect(payload.template.variables.NEXT_STEPS_HTML).toContain("Share a detailed timeline");
    expect(payload.tags).toEqual([{ name: "email_type", value: "meeting_brief_person" }]);
  });
});
