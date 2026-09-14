import roadmapReport from "../../results/q1-2024-product-roadmap.md?raw";
import nordeaReport from "../../results/nordea-implementation-kickoff.md?raw";
import paymentsReport from "../../results/payment-service-architecture-review.md?raw";
import { parseReportMarkdown } from "./markdown.ts";
import type { MeetingReport } from "./report-schema.ts";

export const EXAMPLE_MEETINGS = [
  {
    id: "roadmap",
    title: "Q1 2024 Product Roadmap Planning",
    date: "15 January 2024",
    meetingType: "internal",
    description:
      "Internal planning on Q1 priorities: an integration framework with Economic support, responsive mobile access, and reporting improvements.",
    report: parseReportMarkdown(roadmapReport, "internal"),
  },
  {
    id: "nordea",
    title: "Nordea Bank – Implementation Kickoff",
    date: "22 January 2024",
    meetingType: "client",
    description:
      "Client kickoff covering data migration, training, Azure AD SSO and a 15 March go-live ahead of fiscal year-end.",
    report: parseReportMarkdown(nordeaReport, "client"),
  },
  {
    id: "payments",
    title: "Payment Service Architecture Review",
    date: "18 January 2024",
    meetingType: "technical",
    description:
      "Technical review of moving payment processing to asynchronous AWS SQS workers, with monitoring, circuit breakers and a versioned API.",
    report: parseReportMarkdown(paymentsReport, "technical"),
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  date: string;
  meetingType: MeetingReport["meetingType"];
  description: string;
  report: MeetingReport;
}>;

export type ExampleMeeting = (typeof EXAMPLE_MEETINGS)[number];
export type MeetingType = ExampleMeeting["meetingType"];
