import { z } from "zod";
import type { MeetingReport } from "./report-schema.ts";

export const MEETING_TYPE_LABEL = {
  internal: "Internal",
  client: "Client",
  technical: "Technical",
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendBriefReportSchema = z.object({
  ok: z.literal(true),
  title: z.string().min(1).max(200),
  date: z.string().min(1).max(40),
  meetingType: z.enum(["internal", "client", "technical"]),
  shortSummary: z.string().min(1).max(2000),
  conclusion: z.string().min(1).max(2000),
  people: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        nextSteps: z
          .array(
            z
              .object({
                text: z.string().min(1).max(400),
                due: z.string().max(80).optional(),
              })
              .strip(),
          )
          .max(20),
      }),
    )
    .max(30),
});

export const sendBriefRequestSchema = z.strictObject({
  to: z.array(z.email()).min(1).max(10),
  report: sendBriefReportSchema,
  personName: z.string().min(1).max(80).optional(),
  stepText: z.string().min(1).max(400).optional(),
  sendId: z.string().min(8).max(80),
});

export type SendBriefRequest = z.infer<typeof sendBriefRequestSchema>;

export const DEFAULT_RESEND_TEMPLATE_ID = "meeting-brief";
export const TEMPLATE_STRING_MAX = 2000;

export type BriefTemplateVariables = {
  TITLE: string;
  DATE: string;
  MEETING_TYPE: string;
  PREVIEW_TEXT: string;
  SHORT_SUMMARY: string;
  CONCLUSION: string;
  NEXT_STEPS_HTML: string;
  NEXT_STEPS_TEXT: string;
};

type EmailPerson = MeetingReport["people"][number];

export function toEmailPeople(
  people: MeetingReport["people"],
): MeetingReport["people"] {
  return people.map((person) => ({
    name: person.name,
    nextSteps: person.nextSteps.map((step) => {
      const due = step.due?.trim();
      return due ? { text: step.text, due } : { text: step.text };
    }),
  }));
}

export function toSendBriefReport(
  report: MeetingReport,
): SendBriefRequest["report"] {
  return {
    ok: true,
    title: report.title,
    date: report.date,
    meetingType: report.meetingType,
    shortSummary: report.shortSummary,
    conclusion: report.conclusion,
    people: toEmailPeople(report.people),
  };
}

export function parseRecipientList(value: string): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const part of value.split(/[,;\s]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || seen.has(email)) {
      continue;
    }
    seen.add(email);
    emails.push(email);
  }

  return emails;
}

export function invalidRecipients(emails: string[]): string[] {
  return emails.filter((email) => !EMAIL_PATTERN.test(email));
}

export function briefSubject(report: MeetingReport): string {
  return `Meeting brief: ${report.title}`;
}

export function personBriefSubject(report: MeetingReport, personName: string): string {
  return `${personName}: next steps from ${report.title}`;
}

export function briefPreviewText(report: MeetingReport): string {
  return clipPreview(report.shortSummary);
}

export function personBriefPreviewText(
  report: MeetingReport,
  personName: string,
): string {
  const person = report.people.find((entry) => entry.name === personName);
  const count = person?.nextSteps.length ?? 0;
  const stepLabel = count === 1 ? "next step" : "next steps";
  return clipPreview(`${personName}: ${count} ${stepLabel} from ${report.title}`);
}

export function emailConfigured(env: {
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.RESEND_FROM?.trim());
}

export function resendTemplateId(env: { RESEND_TEMPLATE_ID?: string }): string {
  return env.RESEND_TEMPLATE_ID?.trim() || DEFAULT_RESEND_TEMPLATE_ID;
}

export function peopleForBriefEmail(
  report: MeetingReport,
  options?: { personName?: string; stepText?: string },
): EmailPerson[] {
  let people = toEmailPeople(report.people);
  const personName = options?.personName;
  if (personName) {
    people = people.filter((person) => person.name === personName);
    const stepText = options?.stepText;
    if (stepText) {
      people = people.map((person) => ({
        name: person.name,
        nextSteps: person.nextSteps.filter((step) => step.text === stepText),
      }));
    }
  }
  return people.filter((person) => person.nextSteps.length > 0);
}

export function briefTemplateVariables(
  report: MeetingReport,
  options?: { personName?: string; stepText?: string },
): BriefTemplateVariables {
  const people = peopleForBriefEmail(report, options);
  const emptyHtml = options?.personName
    ? nextStepsEmptyHtml("No named next steps were assigned to this person.")
    : nextStepsEmptyHtml("No named next steps were assigned in this brief.");
  const emptyText = options?.personName
    ? "No named next steps were assigned to this person."
    : "No named next steps were assigned in this brief.";
  const preview = options?.personName
    ? personPreviewFromPeople(report.title, options.personName, people)
    : briefPreviewText(report);

  return {
    TITLE: clipTemplateString(report.title),
    DATE: clipTemplateString(report.date),
    MEETING_TYPE: clipTemplateString(MEETING_TYPE_LABEL[report.meetingType]),
    PREVIEW_TEXT: clipTemplateString(preview),
    SHORT_SUMMARY: clipTemplateString(report.shortSummary),
    CONCLUSION: clipTemplateString(report.conclusion),
    NEXT_STEPS_HTML: clipTemplateString(renderNextStepsHtml(people, emptyHtml)),
    NEXT_STEPS_TEXT: clipTemplateString(renderNextStepsText(people, emptyText)),
  };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clipPreview(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= 90) {
    return text;
  }
  return `${text.slice(0, 87).trimEnd()}...`;
}

function personPreviewFromPeople(
  title: string,
  personName: string,
  people: EmailPerson[],
): string {
  const count = people.reduce((sum, person) => sum + person.nextSteps.length, 0);
  const stepLabel = count === 1 ? "next step" : "next steps";
  return clipPreview(`${personName}: ${count} ${stepLabel} from ${title}`);
}

function clipTemplateString(value: string): string {
  if (value.length <= TEMPLATE_STRING_MAX) {
    return value;
  }
  return `${value.slice(0, TEMPLATE_STRING_MAX - 3).trimEnd()}...`;
}

function nextStepsEmptyHtml(message: string): string {
  return `<p style="font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:24px;color:#5c6573;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;">${escapeHtml(message)}</p>`;
}

function personHeadingHtml(name: string): string {
  return `<h3 style="font-family:Arial, Helvetica, sans-serif;font-size:16px;line-height:24px;font-weight:bold;color:#152033;margin-top:0;margin-right:0;margin-bottom:12px;margin-left:0;">${escapeHtml(name)}</h3>`;
}

function stepRowHtml(step: EmailPerson["nextSteps"][number]): string {
  const due = step.due
    ? `<p style="font-family:Arial, Helvetica, sans-serif;font-size:12px;line-height:20px;color:#5c6573;margin-top:4px;margin-right:0;margin-bottom:0;margin-left:0;">Due ${escapeHtml(step.due)}</p>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;"><tr><td style="border-left-width:3px;border-left-style:solid;border-left-color:#1d6a65;padding-left:12px;"><p style="font-family:Arial, Helvetica, sans-serif;font-size:14px;line-height:24px;color:#152033;margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;">${escapeHtml(step.text)}</p>${due}</td></tr></table>`;
}

function wrapPersonHtml(inner: string): string {
  return `<div style="margin-bottom:20px;">${inner}</div>`;
}

function renderNextStepsHtml(people: EmailPerson[], emptyHtml: string): string {
  if (people.length === 0) {
    return emptyHtml;
  }

  const omitted = nextStepsEmptyHtml("Additional next steps were omitted from this email.");
  let html = "";

  for (const person of people) {
    let inner = personHeadingHtml(person.name);
    let addedStep = false;

    for (const step of person.nextSteps) {
      const nextInner = inner + stepRowHtml(step);
      const candidate = html + wrapPersonHtml(nextInner) + omitted;
      if (candidate.length > TEMPLATE_STRING_MAX) {
        if (addedStep) {
          html += wrapPersonHtml(inner);
        }
        return html ? html + omitted : emptyHtml;
      }
      inner = nextInner;
      addedStep = true;
    }

    if (addedStep) {
      html += wrapPersonHtml(inner);
    }
  }

  return html || emptyHtml;
}

function renderNextStepsText(people: EmailPerson[], emptyText: string): string {
  if (people.length === 0) {
    return emptyText;
  }

  const omitted = "Additional next steps were omitted from this email.";
  const blocks: string[] = [];

  for (const person of people) {
    const lines = [person.name];
    for (const step of person.nextSteps) {
      lines.push(step.due ? `- ${step.text} (Due ${step.due})` : `- ${step.text}`);
      const candidate = [...blocks, lines.join("\n"), omitted].join("\n\n");
      if (candidate.length > TEMPLATE_STRING_MAX) {
        lines.pop();
        if (lines.length > 1) {
          blocks.push(lines.join("\n"));
        }
        return blocks.length > 0 ? `${blocks.join("\n\n")}\n\n${omitted}` : emptyText;
      }
    }
    if (lines.length > 1) {
      blocks.push(lines.join("\n"));
    }
  }

  return blocks.join("\n\n") || emptyText;
}
