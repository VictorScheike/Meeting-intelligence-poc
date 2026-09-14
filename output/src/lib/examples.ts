export const EXAMPLE_MEETINGS = [
  {
    id: "roadmap",
    title: "Q1 2024 Product Roadmap Planning",
    date: "15 January 2024",
    meetingType: "internal",
    description:
      "Internal planning on Q1 priorities: an integration framework with Economic support, responsive mobile access, and reporting improvements.",
  },
  {
    id: "nordea",
    title: "Nordea Bank – Implementation Kickoff",
    date: "22 January 2024",
    meetingType: "client",
    description:
      "Client kickoff covering data migration, training, Azure AD SSO and a 15 March go-live ahead of fiscal year-end.",
  },
  {
    id: "payments",
    title: "Payment Service Architecture Review",
    date: "18 January 2024",
    meetingType: "technical",
    description:
      "Technical review of moving payment processing to asynchronous AWS SQS workers, with monitoring, circuit breakers and a versioned API.",
  },
] as const;

export type ExampleMeeting = (typeof EXAMPLE_MEETINGS)[number];
export type MeetingType = ExampleMeeting["meetingType"];
export type ExampleId = ExampleMeeting["id"];

export function isExampleId(value: string): value is ExampleId {
  return EXAMPLE_MEETINGS.some((meeting) => meeting.id === value);
}

export function exampleIdFromTitle(title: string): ExampleId | undefined {
  const normalised = title.toLowerCase();
  if (normalised.includes("nordea")) {
    return "nordea";
  }
  if (normalised.includes("payment")) {
    return "payments";
  }
  if (normalised.includes("roadmap")) {
    return "roadmap";
  }
  return undefined;
}
