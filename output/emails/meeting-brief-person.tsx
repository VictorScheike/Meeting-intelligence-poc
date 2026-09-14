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
import { BrandHeader, EmailFooter, PersonSteps } from "./parts.tsx";
import tailwindConfig from "./tailwind.config.ts";

export type MeetingBriefPersonEmailProps = {
  title: string;
  date: string;
  personName: string;
  previewText: string;
  conclusion: string;
  nextSteps: Array<{
    text: string;
    due?: string;
  }>;
};

export default function MeetingBriefPersonEmail({
  title,
  date,
  personName,
  previewText,
  conclusion,
  nextSteps,
}: MeetingBriefPersonEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={tailwindConfig}>
        <Head>
          <title>{`${personName} — ${title}`}</title>
        </Head>
        <Body className="bg-brand-bg font-sans py-8">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto max-w-xl bg-brand-surface px-6 py-8 rounded">
            <BrandHeader />
            <Heading
              as="h1"
              className="mt-4 mb-2 text-2xl font-bold text-brand-ink"
            >
              {personName}
            </Heading>
            <Text className="mt-0 mb-6 text-sm text-brand-muted">
              {`Next steps from ${title} · ${date}`}
            </Text>

            <Section className="mb-6 bg-brand-conclusion px-4 py-4 border-none border-l border-solid border-l-brand-accent">
              <Heading
                as="h2"
                className="mt-0 mb-2 text-lg font-semibold text-brand-ink"
              >
                Why this matters
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
                Your next steps
              </Heading>
              <PersonSteps steps={nextSteps} />
            </Section>

            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

MeetingBriefPersonEmail.PreviewProps = {
  title: "Q1 2024 Product Roadmap Planning",
  date: "15 January 2024",
  personName: "Line Petersen",
  previewText:
    "Line Petersen: 2 next steps from Q1 2024 Product Roadmap Planning",
  conclusion:
    "The team will focus on developing an integration framework, responsive web design, and improved reporting capabilities in Q1.",
  nextSteps: [
    {
      text: "Work with Michael on a more detailed timeline for the integration framework.",
      due: "end of week",
    },
    { text: "Plan for responsive design in Q1." },
  ],
} satisfies MeetingBriefPersonEmailProps;
