import { describe, expect, it } from "vitest";
import {
  briefPreviewText,
  briefSubject,
  briefTemplateVariables,
  emailConfigured,
  escapeHtml,
  invalidRecipients,
  parseRecipientList,
  personBriefPreviewText,
  personBriefSubject,
  resendTemplateId,
  sendBriefRequestSchema,
  TEMPLATE_STRING_MAX,
  toSendBriefReport,
} from "./email.ts";
import type { MeetingReport } from "./report-schema.ts";

const report: MeetingReport = {
  ok: true,
  title: "Q1 2024 Product Roadmap Planning",
  date: "15 January 2024",
  meetingType: "internal",
  shortSummary:
    "The team locked Q1 priorities around an integration framework, mobile access, and reporting.",
  conclusion: "Build an integration framework before one-off connectors.",
  people: [
    {
      name: "Line Petersen",
      nextSteps: [{ text: "Share a detailed timeline", due: "end of week" }],
    },
  ],
};

describe("recipient parsing", () => {
  it("splits, lowercases and dedupes addresses", () => {
    expect(parseRecipientList("Ada@Example.com, bob@example.com ADA@example.com")).toEqual([
      "ada@example.com",
      "bob@example.com",
    ]);
  });

  it("flags malformed addresses", () => {
    expect(invalidRecipients(["ada@example.com", "not-an-email"])).toEqual(["not-an-email"]);
  });
});

describe("email copy", () => {
  it("builds a specific subject and a short preview", () => {
    expect(briefSubject(report)).toBe("Meeting brief: Q1 2024 Product Roadmap Planning");
    expect(briefPreviewText(report).length).toBeLessThanOrEqual(90);
    expect(personBriefSubject(report, "Line Petersen")).toContain("Line Petersen");
    expect(personBriefPreviewText(report, "Line Petersen")).toContain("1 next step");
  });
});

describe("send brief request", () => {
  it("accepts a valid payload and rejects extra keys", () => {
    const parsed = sendBriefRequestSchema.parse({
      to: ["delivered@resend.dev"],
      report,
      sendId: "send-brief-1",
    });
    expect(parsed.to).toEqual(["delivered@resend.dev"]);
    expect(
      sendBriefRequestSchema.safeParse({
        to: ["delivered@resend.dev"],
        report,
        sendId: "send-brief-1",
        extra: true,
      }).success,
    ).toBe(false);
  });

  it("accepts an optional person and next step", () => {
    const parsed = sendBriefRequestSchema.parse({
      to: ["delivered@resend.dev"],
      report,
      personName: "Line Petersen",
      stepText: "Share a detailed timeline",
      sendId: "send-brief-2",
    });
    expect(parsed.personName).toBe("Line Petersen");
    expect(parsed.stepText).toBe("Share a detailed timeline");
  });

  it("strips source quotes so live briefs still send", () => {
    const withSources: MeetingReport = {
      ...report,
      people: [
        {
          name: "Line Petersen",
          nextSteps: [
            {
              text: "Share a detailed timeline",
              due: "end of week",
              sources: ["we should share a timeline"],
            },
          ],
        },
      ],
    };
    const prepared = toSendBriefReport(withSources);
    expect(prepared.people[0]?.nextSteps[0]).toEqual({
      text: "Share a detailed timeline",
      due: "end of week",
    });
    const parsed = sendBriefRequestSchema.parse({
      to: ["delivered@resend.dev"],
      report: withSources,
      sendId: "send-brief-3",
    });
    expect(parsed.report.people[0]?.nextSteps[0]).toEqual({
      text: "Share a detailed timeline",
      due: "end of week",
    });
  });
});

describe("resend configuration", () => {
  it("requires an API key and from address", () => {
    expect(emailConfigured({ RESEND_API_KEY: "re_test", RESEND_FROM: "Briefs <a@b.co>" })).toBe(
      true,
    );
    expect(emailConfigured({ RESEND_API_KEY: "re_test" })).toBe(false);
    expect(emailConfigured({ RESEND_FROM: "Briefs <a@b.co>" })).toBe(false);
  });

  it("defaults to the published meeting-brief template alias", () => {
    expect(resendTemplateId({})).toBe("meeting-brief");
    expect(resendTemplateId({ RESEND_TEMPLATE_ID: "  tmpl_custom  " })).toBe("tmpl_custom");
  });
});

describe("brief template variables", () => {
  it("maps the report onto the stored Resend template keys", () => {
    const variables = briefTemplateVariables(report);
    expect(variables.TITLE).toBe(report.title);
    expect(variables.DATE).toBe(report.date);
    expect(variables.MEETING_TYPE).toBe("Internal");
    expect(variables.SHORT_SUMMARY).toBe(report.shortSummary);
    expect(variables.CONCLUSION).toBe(report.conclusion);
    expect(variables.NEXT_STEPS_HTML).toContain("Line Petersen");
    expect(variables.NEXT_STEPS_HTML).toContain("Share a detailed timeline");
    expect(variables.NEXT_STEPS_HTML).toContain("Due end of week");
    expect(variables.NEXT_STEPS_TEXT).toContain("- Share a detailed timeline (Due end of week)");
    expect(variables.PREVIEW_TEXT.length).toBeLessThanOrEqual(90);
  });

  it("limits next steps to one person or one step", () => {
    const withSecond: MeetingReport = {
      ...report,
      people: [
        ...report.people,
        { name: "Michael Andersen", nextSteps: [{ text: "Review the timeline" }] },
      ],
    };
    const person = briefTemplateVariables(withSecond, { personName: "Line Petersen" });
    expect(person.NEXT_STEPS_HTML).toContain("Line Petersen");
    expect(person.NEXT_STEPS_HTML).not.toContain("Michael Andersen");
    expect(person.PREVIEW_TEXT).toContain("Line Petersen");

    const step = briefTemplateVariables(withSecond, {
      personName: "Line Petersen",
      stepText: "Share a detailed timeline",
    });
    expect(step.NEXT_STEPS_HTML).toContain("Share a detailed timeline");
    expect(step.NEXT_STEPS_HTML).not.toContain("Review the timeline");
  });

  it("escapes untrusted next-step text in the HTML variable", () => {
    const unsafe: MeetingReport = {
      ...report,
      people: [
        {
          name: `Line <img src=x>`,
          nextSteps: [{ text: `<script>alert("x")</script>` }],
        },
      ],
    };
    const html = briefTemplateVariables(unsafe).NEXT_STEPS_HTML;
    expect(html).toContain(escapeHtml(`Line <img src=x>`));
    expect(html).toContain(escapeHtml(`<script>alert("x")</script>`));
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x>");
  });

  it("keeps template strings within Resend's variable limit", () => {
    const longStep = "A".repeat(400);
    const crowded: MeetingReport = {
      ...report,
      people: Array.from({ length: 20 }, (_, index) => ({
        name: `Person ${index + 1}`,
        nextSteps: Array.from({ length: 10 }, (__, stepIndex) => ({
          text: `${longStep} ${stepIndex + 1}`,
        })),
      })),
    };
    const variables = briefTemplateVariables(crowded);
    expect(variables.NEXT_STEPS_HTML.length).toBeLessThanOrEqual(TEMPLATE_STRING_MAX);
    expect(variables.NEXT_STEPS_TEXT.length).toBeLessThanOrEqual(TEMPLATE_STRING_MAX);
    expect(variables.NEXT_STEPS_HTML).toContain("Additional next steps were omitted");
  });

  it("keeps first-name-only people and the last person in a typical whole brief", () => {
    const firstNames: MeetingReport = {
      ...report,
      people: ["Line", "Michael", "Sofie", "Victor", "Ann"].map((name) => ({
        name,
        nextSteps: [{ text: `${name} will share the timeline this week` }],
      })),
    };
    const variables = briefTemplateVariables(firstNames);
    expect(variables.NEXT_STEPS_HTML).toContain("Ann");
    expect(variables.NEXT_STEPS_HTML).toContain("Victor");
    expect(variables.NEXT_STEPS_HTML).not.toContain("Additional next steps were omitted");
    expect(variables.NEXT_STEPS_TEXT).toContain("Ann");
  });
});
