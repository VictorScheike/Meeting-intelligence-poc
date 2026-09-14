import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "react-email";
import { BrandHeader, EmailFooter, NextSteps } from "./parts.tsx";
import tailwindConfig from "./tailwind.config.ts";

export type MeetingBriefEmailProps = {
  title: string;
  date: string;
  meetingTypeLabel: string;
  previewText: string;
  shortSummary: string;
  conclusion: string;
  people: Array<{
    name: string;
    nextSteps: Array<{
      text: string;
      due?: string;
    }>;
  }>;
};

export default function MeetingBriefEmail({
  title,
  date,
  meetingTypeLabel,
  previewText,
  shortSummary,
  conclusion,
  people,
}: MeetingBriefEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={tailwindConfig}>
        <Head>
          <title>{title}</title>
        </Head>
        <Body className="bg-brand-bg font-sans py-8">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto max-w-xl bg-brand-surface px-6 py-8 rounded">
            <BrandHeader />
            <Heading
              as="h1"
              className="mt-4 mb-2 text-2xl font-bold text-brand-ink"
            >
              {title}
            </Heading>
            <Text className="mt-0 mb-6 text-sm text-brand-muted">
              {`${date} · ${meetingTypeLabel}`}
            </Text>

            <Section className="mb-6">
              <Heading
                as="h2"
                className="mt-0 mb-2 text-lg font-semibold text-brand-ink"
              >
                Short summary
              </Heading>
              <Text className="m-0 text-base leading-7 text-brand-ink">
                {shortSummary}
              </Text>
            </Section>

            <Section className="mb-6 bg-brand-conclusion px-4 py-4 border-none border-l border-solid border-l-brand-accent">
              <Heading
                as="h2"
                className="mt-0 mb-2 text-lg font-semibold text-brand-ink"
              >
                Conclusion
              </Heading>
              <Text className="m-0 text-base leading-7 text-brand-ink">
                {conclusion}
              </Text>
            </Section>

            <Section>
              <Heading
                as="h2"
                className="mt-0 mb-4 text-lg font-semibold text-brand-ink"
              >
                Next steps by person
              </Heading>
              <NextSteps people={people} />
            </Section>

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

MeetingBriefEmail.PreviewProps = {
  title: "Q1 2024 Product Roadmap Planning",
  date: "15 January 2024",
  meetingTypeLabel: "Internal",
  previewText:
    "The team will pursue an integration framework, responsive web, and stronger reporting in Q1.",
  shortSummary:
    "The team discussed the Q1 roadmap focusing on three main areas: integration requests, mobile access, and reporting capabilities. They decided to pursue a flexible integration framework for Economic and Billy, implement responsive web design for mobile, and enhance reporting features.",
  conclusion:
    "The team will focus on developing an integration framework, responsive web design, and improved reporting capabilities in Q1. Line and Michael will provide a detailed timeline for the integration work, and Thomas will document mobile use cases.",
  people: [
    {
      name: "Line Petersen",
      nextSteps: [
        {
          text: "Work with Michael on a more detailed timeline for the integration framework.",
          due: "end of week",
        },
        { text: "Plan for responsive design in Q1." },
      ],
    },
    {
      name: "Michael Andersen",
      nextSteps: [
        {
          text: "Collaborate with Line on the detailed timeline for the integration framework.",
          due: "end of week",
        },
      ],
    },
    {
      name: "Thomas Nielsen",
      nextSteps: [
        { text: "Document the specific mobile use cases being heard from clients." },
      ],
    },
  ],
} satisfies MeetingBriefEmailProps;
