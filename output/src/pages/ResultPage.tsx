import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PersonChecklist } from "@/components/PersonChecklist.tsx";
import { ReportActions } from "@/components/ReportActions.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { formatPersonMarkdown, formatReportMarkdown } from "@/lib/markdown.ts";
import type { MeetingReport } from "@/lib/report-schema.ts";
import { copyText, shareByEmail } from "@/lib/share.ts";

const typeLabel = {
  internal: "Internal",
  client: "Client",
  technical: "Technical",
} as const;

type ResultPageProps = {
  report: MeetingReport;
  onBack: () => void;
};

export function ResultPage({ report, onBack }: ResultPageProps) {
  const peopleWithWork = report.people.filter((person) => person.nextSteps.length > 0);

  async function copyReport() {
    const ok = await copyText(formatReportMarkdown(report));
    if (ok) {
      toast.success("Report copied to clipboard.");
    } else {
      toast.error("Clipboard access was blocked.");
    }
  }

  async function emailReport() {
    const result = await shareByEmail(
      report.title,
      formatReportMarkdown(report),
    );
    if (result === "copied") {
      toast.message("The email is too long for this browser, so the report was copied instead.");
    } else if (result === "failed") {
      toast.error("The report could not be shared by email.");
    }
  }

  async function copyPerson(name: string) {
    const ok = await copyText(formatPersonMarkdown(report, name));
    if (ok) {
      toast.success(`${name}'s next steps copied.`);
    } else {
      toast.error("Clipboard access was blocked.");
    }
  }

  async function emailPerson(name: string) {
    const result = await shareByEmail(
      `${report.title} — ${name}`,
      formatPersonMarkdown(report, name),
    );
    if (result === "copied") {
      toast.message("The email is too long for this browser, so the checklist was copied instead.");
    } else if (result === "failed") {
      toast.error("The checklist could not be shared by email.");
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="-ml-2" onClick={onBack}>
        <ArrowLeft />
        Back to meetings
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl tracking-tight">{report.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{report.date}</span>
            <Badge variant={report.meetingType}>{typeLabel[report.meetingType]}</Badge>
          </div>
        </div>
        <ReportActions
          onCopy={() => void copyReport()}
          onEmail={() => void emailReport()}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Short summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-3xl text-base leading-relaxed">{report.shortSummary}</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-accent bg-[color-mix(in_srgb,var(--color-accent)_6%,white)]">
        <CardHeader>
          <CardTitle className="font-serif">Conclusion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="max-w-3xl text-base leading-relaxed">{report.conclusion}</p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Next steps by person</h2>
          <p className="text-sm text-muted-foreground">
            Checklist ticks stay in this browser only.
          </p>
        </div>
        {peopleWithWork.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                No named next steps were assigned in this transcript.
              </p>
            </CardContent>
          </Card>
        ) : (
          peopleWithWork.map((person) => (
            <PersonChecklist
              key={person.name}
              report={report}
              person={person}
              onCopy={() => void copyPerson(person.name)}
              onEmail={() => void emailPerson(person.name)}
            />
          ))
        )}
      </section>
    </div>
  );
}
