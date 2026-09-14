import { Resend } from "resend";
import {
  briefSubject,
  briefTemplateVariables,
  personBriefSubject,
  type SendBriefRequest,
} from "../src/lib/email.ts";

export function buildBriefEmailPayload(args: {
  from: string;
  replyTo?: string;
  templateId: string;
  request: SendBriefRequest;
}) {
  const personName = args.request.personName;
  return {
    from: args.from,
    to: args.request.to,
    subject: personName
      ? personBriefSubject(args.request.report, personName)
      : briefSubject(args.request.report),
    template: {
      id: args.templateId,
      variables: briefTemplateVariables(args.request.report, {
        personName,
        stepText: args.request.stepText,
      }),
    },
    tags: [
      { name: "email_type", value: personName ? "meeting_brief_person" : "meeting_brief" },
    ],
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
  };
}

export async function sendMeetingBrief(args: {
  apiKey: string;
  from: string;
  replyTo?: string;
  templateId: string;
  request: SendBriefRequest;
}): Promise<{ ok: true; id: string } | { ok: false; status: 400 | 429 | 502; message: string }> {
  const { request } = args;
  const personName = request.personName;

  if (personName) {
    const person = request.report.people.find((entry) => entry.name === personName);
    if (!person) {
      return {
        ok: false,
        status: 400,
        message: "That person is not in this brief.",
      };
    }
    if (request.stepText && !person.nextSteps.some((step) => step.text === request.stepText)) {
      return {
        ok: false,
        status: 400,
        message: "That next step is not in this brief.",
      };
    }
  }

  const resend = new Resend(args.apiKey);
  const { data, error } = await resend.emails.send(
    buildBriefEmailPayload({
      from: args.from,
      replyTo: args.replyTo,
      templateId: args.templateId,
      request,
    }),
    { idempotencyKey: `meeting-brief/${request.sendId}` },
  );

  if (error) {
    console.error("Resend send failed", error.message);
    if (error.statusCode === 429) {
      return {
        ok: false,
        status: 429,
        message: "Too many emails were sent. Please try again shortly.",
      };
    }
    return {
      ok: false,
      status: 502,
      message: "The brief could not be emailed. Please try again.",
    };
  }

  if (!data?.id) {
    return {
      ok: false,
      status: 502,
      message: "The brief could not be emailed. Please try again.",
    };
  }

  return { ok: true, id: data.id };
}
