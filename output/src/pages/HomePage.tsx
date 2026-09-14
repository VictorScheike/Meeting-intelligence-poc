import { CheckCircle2, ListChecks, Share2 } from "lucide-react";
import { ExampleMeetingCard } from "@/components/ExampleMeetingCard.tsx";
import { TranscriptUpload } from "@/components/TranscriptUpload.tsx";
import { EXAMPLE_MEETINGS, type ExampleMeeting } from "@/lib/examples.ts";
import type { MeetingReport } from "@/lib/report-schema.ts";

type HomePageProps = {
  busy: boolean;
  onOpenExample: (report: MeetingReport) => void;
  onAnalyse: (transcript: string) => void;
  onInvalid: (message: string) => void;
};

export function HomePage({
  busy,
  onOpenExample,
  onAnalyse,
  onInvalid,
}: HomePageProps) {
  function openExample(meeting: ExampleMeeting) {
    onOpenExample(meeting.report);
  }

  return (
    <div className="space-y-10">
      <section className="max-w-3xl">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          Get the meeting outcome without rereading the transcript.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Open a prepared brief from one of the sample meetings, or upload your own
          .txt transcript for a live analysis.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          <Benefit icon={CheckCircle2} label="Quick brief" />
          <Benefit icon={ListChecks} label="Accountable next steps" />
          <Benefit icon={Share2} label="Easy sharing" />
        </ul>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Try an example</h2>
          <p className="text-sm text-muted-foreground">
            These cards open the committed meeting briefs. They do not upload or
            expose the original transcripts.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EXAMPLE_MEETINGS.map((meeting) => (
            <ExampleMeetingCard
              key={meeting.id}
              meeting={meeting}
              disabled={busy}
              onOpen={openExample}
            />
          ))}
        </div>
      </section>

      <TranscriptUpload disabled={busy} onGenerate={onAnalyse} onInvalid={onInvalid} />
    </div>
  );
}

function Benefit({
  icon: Icon,
  label,
}: {
  icon: typeof CheckCircle2;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
      <Icon className="h-4 w-4 text-accent" aria-hidden="true" />
      {label}
    </li>
  );
}
