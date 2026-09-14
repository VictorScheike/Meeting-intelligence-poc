import { CheckCircle2, ListChecks, Share2 } from "lucide-react";
import { useState } from "react";
import { ExampleMeetingCard } from "@/components/ExampleMeetingCard.tsx";
import { MeetingNotesDialog } from "@/components/MeetingNotesDialog.tsx";
import { RecentUploads } from "@/components/RecentUploads.tsx";
import { TranscriptUpload } from "@/components/TranscriptUpload.tsx";
import { fetchExampleNotes, RequestError } from "@/lib/api.ts";
import type { CachedBrief } from "@/lib/brief-cache.ts";
import { EXAMPLE_MEETINGS, type ExampleMeeting } from "@/lib/examples.ts";

type HomePageProps = {
  busy: boolean;
  uploads: CachedBrief[];
  onGenerateExample: (meeting: ExampleMeeting) => void;
  onOpenCached: (brief: CachedBrief) => void;
  onAnalyseUpload: (transcript: string, fileName: string) => void;
  onInvalid: (message: string) => void;
  onAuthExpired: () => void;
};

export function HomePage({
  busy,
  uploads,
  onGenerateExample,
  onOpenCached,
  onAnalyseUpload,
  onInvalid,
  onAuthExpired,
}: HomePageProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesTitle, setNotesTitle] = useState("Original meeting notes");
  const [notesDate, setNotesDate] = useState<string | undefined>();
  const [notesText, setNotesText] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);

  async function readNotes(meeting: ExampleMeeting) {
    setNotesTitle(meeting.title);
    setNotesDate(meeting.date);
    setNotesText("");
    setNotesLoading(true);
    setNotesOpen(true);
    try {
      const notes = await fetchExampleNotes(meeting.id);
      setNotesTitle(notes.title);
      setNotesDate(notes.date);
      setNotesText(notes.transcript);
    } catch (error) {
      setNotesOpen(false);
      if (error instanceof RequestError && error.status === 401) {
        onAuthExpired();
        return;
      }
      onInvalid(
        error instanceof RequestError
          ? error.message
          : "The Original meeting notes could not be loaded.",
      );
    } finally {
      setNotesLoading(false);
    }
  }

  return (
    <div className="space-y-10 min-w-0">
      <section className="max-w-3xl">
        <h1 className="font-serif text-2xl tracking-tight sm:text-3xl md:text-4xl">
          Get the meeting outcome without rereading the Original meeting notes.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          Generate a fresh brief from a sample meeting, read the Original meeting notes, or
          upload your own .txt meeting notes. Files that are not a meeting or
          transcript are rejected with an error.
        </p>
        <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Benefit icon={CheckCircle2} label="Quick Brief" />
          <Benefit icon={ListChecks} label="Accountable next steps" />
          <Benefit icon={Share2} label="Easy sharing" />
        </ul>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Try an example</h2>
          <p className="text-sm text-muted-foreground">
            Generate Brief calls the analysis API each time. Original meeting notes opens
            that text in a window.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_MEETINGS.map((meeting) => (
            <ExampleMeetingCard
              key={meeting.id}
              meeting={meeting}
              disabled={busy}
              onGenerate={onGenerateExample}
              onReadNotes={(next) => void readNotes(next)}
            />
          ))}
        </div>
      </section>

      <TranscriptUpload
        disabled={busy}
        onGenerate={onAnalyseUpload}
        onInvalid={onInvalid}
      />

      <RecentUploads items={uploads} disabled={busy} onOpen={onOpenCached} />

      <MeetingNotesDialog
        open={notesOpen}
        title={notesTitle}
        date={notesDate}
        notes={notesText}
        loading={notesLoading}
        onClose={() => setNotesOpen(false)}
      />
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
    <li className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm sm:min-w-[10.5rem] sm:flex-1">
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
      <span className="min-w-0">{label}</span>
    </li>
  );
}
