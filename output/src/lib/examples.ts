export const EXAMPLE_MEETINGS = [
  {
    id: "roadmap",
    title: "Q1 2024 Product Roadmap Planning",
    date: "15 January 2024",
    meetingType: "internal",
    description:
      "Internal planning on Q1 priorities: an integration framework with Economic support, responsive mobile access, and reporting improvements.",
    fileName: "q1-2024-product-roadmap.txt",
  },
  {
    id: "nordea",
    title: "Nordea Bank – Implementation Kickoff",
    date: "22 January 2024",
    meetingType: "client",
    description:
      "Client kickoff covering data migration, training, Azure AD SSO and a 15 March go-live ahead of fiscal year-end.",
    fileName: "nordea-implementation-kickoff.txt",
  },
  {
    id: "payments",
    title: "Payment Service Architecture Review",
    date: "18 January 2024",
    meetingType: "technical",
    description:
      "Technical review of moving payment processing to asynchronous AWS SQS workers, with monitoring, circuit breakers and a versioned API.",
    fileName: "payment-service-architecture-review.txt",
  },
] as const;

export type ExampleMeeting = (typeof EXAMPLE_MEETINGS)[number];
export type MeetingType = ExampleMeeting["meetingType"];
