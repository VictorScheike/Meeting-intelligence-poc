import { ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BriefContextMenu } from "@/components/BriefContextMenu.tsx";
import { MeetingNotesDialog } from "@/components/MeetingNotesDialog.tsx";
import { PersonChecklist } from "@/components/PersonChecklist.tsx";
import { ReportActions } from "@/components/ReportActions.tsx";
import { SendBriefDialog } from "@/components/SendBriefDialog.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { fetchExampleNotes, RequestError, sendBrief } from "@/lib/api.ts";
import { toSendBriefReport } from "@/lib/email.ts";
import type { ExampleId } from "@/lib/examples.ts";
import { locateTaskSources, type TextSpan } from "@/lib/locate-sources.ts";
import { formatPersonMarkdown, formatReportMarkdown } from "@/lib/markdown.ts";
import type { MeetingReport } from "@/lib/report-schema.ts";
import { copyText } from "@/lib/share.ts";
import { cn } from "@/lib/utils.ts";

const typeLabel = {
  internal: "Internal",
  client: "Client",
  technical: "Technical",
} as const;

type ResultPageProps = {
  report: MeetingReport;
  exampleId?: ExampleId;
  transcript?: string;
  canSendEmail?: boolean;
  onBack: () => void;
  onAuthExpired: () => void;
};

type NextStep = MeetingReport["people"][number]["nextSteps"][number];
type EmailTarget =
  | { kind: "report" }
  | { kind: "person"; name: string }
  | { kind: "step"; name: string; text: string };

export function ResultPage({
  report,
  exampleId,
  transcript,
  canSendEmail = false,
  onBack,
  onAuthExpired,
}: ResultPageProps) {
  const peopleWithWork = report.people.filter((person) => person.nextSteps.length > 0);
  const canReadNotes = Boolean(exampleId || transcript);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesText, setNotesText] = useState(transcript ?? "");
  const [notesLoading, setNotesLoading] = useState(false);
  const [highlights, setHighlights] = useState<TextSpan[]>([]);
  const [emailTarget, setEmailTarget] = useState<EmailTarget | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  async function copyReport() {
    const ok = await copyText(formatReportMarkdown(report));
    if (ok) {
      toast.success("Brief copied to clipboard.");
    } else {
      toast.error("Clipboard access was blocked.");
    }
  }

  async function copyStep(name: string, step: NextStep) {
    const ok = await copyText(
      step.due ? `- [ ] ${step.text} (${step.due})` : `- [ ] ${step.text}`,
    );
    if (ok) {
      toast.success(`${name}'s next step copied.`);
    } else {
      toast.error("Clipboard access was blocked.");
    }
  }

  async function emailStep(name: string, text: string, recipients: string[]) {
    await sendOrShare({
      recipients,
      personName: name,
      stepText: text,
      failedMessage: "The next step could not be emailed.",
      sentMessage: `${name}'s next step emailed.`,
    });
  }

  function applyHighlights(
    text: string,
    input: { text: string; sources?: string[]; personName?: string },
  ) {
    const spans = locateTaskSources(text, input);
    setHighlights(spans);
    if (spans.length === 0) {
      toast.message("No matching passage was found in the Original meeting notes.");
    }
  }

  async function ensureOriginalBrief(): Promise<string | null> {
    if (transcript) {
      setNotesText(transcript);
      return transcript;
    }
    if (!exampleId) {
      toast.error("The Original meeting notes are not available.");
      return null;
    }
    if (notesText.trim().length > 0) {
      return notesText;
    }
    setNotesLoading(true);
    try {
      const notes = await fetchExampleNotes(exampleId);
      setNotesText(notes.transcript);
      return notes.transcript;
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        onAuthExpired();
        return null;
      }
      toast.error(
        error instanceof RequestError
          ? error.message
          : "The Original meeting notes could not be loaded.",
      );
      return null;
    } finally {
      setNotesLoading(false);
    }
  }

  async function showNoteSource(input: {
    text: string;
    sources?: string[];
    personName?: string;
  }) {
    if (!canReadNotes) {
      toast.error("The Original meeting notes are not available.");
      return;
    }
    setNotesOpen(true);
    const text = await ensureOriginalBrief();
    if (!text) {
      return;
    }
    applyHighlights(text, input);
  }

  async function copyPerson(name: string) {
    const ok = await copyText(formatPersonMarkdown(report, name));
    if (ok) {
      toast.success(`${name}'s next steps copied.`);
    } else {
      toast.error("Clipboard access was blocked.");
    }
  }

  async function sendOrShare({
    recipients,
    personName,
    stepText,
    failedMessage,
    sentMessage,
  }: {
    recipients: string[];
    personName?: string;
    stepText?: string;
    failedMessage: string;
    sentMessage: string;
  }) {
    setSendingEmail(true);
    try {
      await sendBrief({
        to: recipients,
        report: toSendBriefReport(report),
        ...(personName ? { personName } : {}),
        ...(stepText ? { stepText } : {}),
        sendId: crypto.randomUUID(),
      });
      toast.success(sentMessage);
      setEmailTarget(null);
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        onAuthExpired();
        return;
      }
      throw new Error(
        error instanceof RequestError ? error.message : failedMessage,
      );
    } finally {
      setSendingEmail(false);
    }
  }

  async function emailReport(recipients: string[]) {
    await sendOrShare({
      recipients,
      failedMessage: "The brief could not be emailed.",
      sentMessage: "Brief emailed.",
    });
  }

  async function emailPerson(name: string, recipients: string[]) {
    await sendOrShare({
      recipients,
      personName: name,
      failedMessage: "The checklist could not be emailed.",
      sentMessage: `${name}'s next steps emailed.`,
    });
  }

  async function readNotes() {
    if (!canReadNotes) {
      return;
    }
    setHighlights([]);
    setNotesOpen(true);
    if (transcript) {
      setNotesText(transcript);
      setNotesLoading(false);
      return;
    }
    if (!exampleId) {
      return;
    }
    setNotesLoading(true);
    setNotesText("");
    try {
      const notes = await fetchExampleNotes(exampleId);
      setNotesText(notes.transcript);
    } catch (error) {
      setNotesOpen(false);
      if (error instanceof RequestError && error.status === 401) {
        onAuthExpired();
        return;
      }
      toast.error(
        error instanceof RequestError
          ? error.message
          : "The Original meeting notes could not be loaded.",
      );
    } finally {
      setNotesLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "min-w-0 space-y-6 transition-[padding] duration-200",
        notesOpen && "pb-[min(52vh,28rem)] md:pb-0 md:pr-[min(32rem,42vw)]",
      )}
    >
      <Button variant="ghost" className="-ml-2" onClick={onBack}>
        <ArrowLeft />
        Back to meetings
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">{report.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{report.date}</span>
            <Badge variant={report.meetingType}>{typeLabel[report.meetingType]}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReadNotes ? (
            <Button variant="outline" size="sm" onClick={() => void readNotes()}>
              <FileText />
              Original meeting notes
            </Button>
          ) : null}
          <ReportActions
            onCopy={() => void copyReport()}
            onEmail={() => setEmailTarget({ kind: "report" })}
          />
        </div>
      </div>

      <BriefContextMenu
        className="block"
        canShowSource={canReadNotes}
        onCopy={() => {
          void copyText(report.shortSummary).then((ok) => {
            if (ok) {
              toast.success("Summary copied to clipboard.");
            } else {
              toast.error("Clipboard access was blocked.");
            }
          });
        }}
        onEmail={() => setEmailTarget({ kind: "report" })}
        onShowSource={() => void showNoteSource({ text: report.shortSummary })}
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Short summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-3xl text-base leading-relaxed">{report.shortSummary}</p>
          </CardContent>
        </Card>
      </BriefContextMenu>

      <BriefContextMenu
        className="block"
        canShowSource={canReadNotes}
        onCopy={() => {
          void copyText(report.conclusion).then((ok) => {
            if (ok) {
              toast.success("Conclusion copied to clipboard.");
            } else {
              toast.error("Clipboard access was blocked.");
            }
          });
        }}
        onEmail={() => setEmailTarget({ kind: "report" })}
        onShowSource={() => void showNoteSource({ text: report.conclusion })}
      >
        <Card className="border-l-4 border-l-accent bg-[color-mix(in_srgb,var(--color-accent)_6%,white)]">
          <CardHeader>
            <CardTitle className="font-serif">Conclusion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-3xl text-base leading-relaxed">{report.conclusion}</p>
          </CardContent>
        </Card>
      </BriefContextMenu>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Next steps by person</h2>
          <p className="text-sm text-muted-foreground">
            Checklist ticks stay in this browser only. Use Show note source next
            to a step, or right-click to copy, send email, or show note source.
          </p>
        </div>
        {peopleWithWork.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No named next steps were assigned in this brief.
              </p>
            </CardContent>
          </Card>
        ) : (
          peopleWithWork.map((person) => (
            <PersonChecklist
              key={person.name}
              report={report}
              person={person}
              canShowSource={canReadNotes}
              onCopy={() => void copyPerson(person.name)}
              onEmail={() => setEmailTarget({ kind: "person", name: person.name })}
              onCopyStep={(step) => void copyStep(person.name, step)}
              onEmailStep={(step) =>
                setEmailTarget({ kind: "step", name: person.name, text: step.text })
              }
              onShowSource={(step) =>
                void showNoteSource({
                  text: step.text,
                  sources: step.sources,
                  personName: person.name,
                })
              }
            />
          ))
        )}
      </section>

      <MeetingNotesDialog
        open={notesOpen}
        variant="overlay"
        title={report.title}
        date={report.date}
        notes={notesText}
        highlights={highlights}
        loading={notesLoading}
        onClose={() => setNotesOpen(false)}
      />

      <SendBriefDialog
        open={emailTarget !== null}
        title={
          emailTarget?.kind === "person"
            ? `Email ${emailTarget.name}'s next steps`
            : emailTarget?.kind === "step"
              ? `Email ${emailTarget.name}'s next step`
              : "Email this brief"
        }
        description={
          emailTarget?.kind === "person"
            ? `Send ${emailTarget.name}'s checklist from ${report.title}.`
            : emailTarget?.kind === "step"
              ? `Send this next step from ${report.title}.`
              : `Send the formatted brief for ${report.title}.`
        }
        sending={sendingEmail}
        canSendEmail={canSendEmail}
        onClose={() => {
          if (!sendingEmail) {
            setEmailTarget(null);
          }
        }}
        onSend={async (recipients) => {
          if (emailTarget?.kind === "person") {
            await emailPerson(emailTarget.name, recipients);
            return;
          }
          if (emailTarget?.kind === "step") {
            await emailStep(emailTarget.name, emailTarget.text, recipients);
            return;
          }
          await emailReport(recipients);
        }}
      />
    </div>
  );
}
