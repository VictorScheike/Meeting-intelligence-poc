import { Copy, FileSearch, Mail } from "lucide-react";
import { useState } from "react";
import { BriefContextMenu } from "@/components/BriefContextMenu.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import type { MeetingReport } from "@/lib/report-schema.ts";
import { checklistKey, readChecklistItem, writeChecklistItem } from "@/lib/storage.ts";
import { cn } from "@/lib/utils.ts";

type PersonChecklistProps = {
  report: MeetingReport;
  person: MeetingReport["people"][number];
  canShowSource?: boolean;
  onCopy: () => void;
  onEmail: () => void;
  onCopyStep: (step: MeetingReport["people"][number]["nextSteps"][number]) => void;
  onEmailStep: (step: MeetingReport["people"][number]["nextSteps"][number]) => void;
  onShowSource: (step: MeetingReport["people"][number]["nextSteps"][number]) => void;
};

export function PersonChecklist({
  report,
  person,
  canShowSource,
  onCopy,
  onEmail,
  onCopyStep,
  onEmailStep,
  onShowSource,
}: PersonChecklistProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="font-serif">{person.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {person.nextSteps.length} next step{person.nextSteps.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={onEmail}>
            <Mail />
            Send email
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {person.nextSteps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No named next steps were assigned to this person.
          </p>
        ) : (
          person.nextSteps.map((step) => (
            <ChecklistItem
              key={`${person.name}-${step.text}`}
              storageKey={checklistKey(report.title, person.name, step.text)}
              text={step.text}
              due={step.due}
              canShowSource={canShowSource}
              onCopy={() => onCopyStep(step)}
              onEmail={() => onEmailStep(step)}
              onShowSource={() => onShowSource(step)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  storageKey,
  text,
  due,
  canShowSource,
  onCopy,
  onEmail,
  onShowSource,
}: {
  storageKey: string;
  text: string;
  due?: string;
  canShowSource?: boolean;
  onCopy: () => void;
  onEmail: () => void;
  onShowSource: () => void;
}) {
  const [checked, setChecked] = useState(() => readChecklistItem(storageKey));

  return (
    <div className="flex items-start gap-1 rounded-md border border-transparent p-2 hover:bg-muted/60">
      <BriefContextMenu
        className="min-w-0 flex-1 rounded-md"
        canShowSource={canShowSource}
        onCopy={onCopy}
        onEmail={onEmail}
        onShowSource={onShowSource}
      >
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={checked}
            onCheckedChange={(value) => {
              const next = value === true;
              setChecked(next);
              writeChecklistItem(storageKey, next);
            }}
            aria-label={text}
          />
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block text-sm leading-relaxed",
                checked && "text-muted-foreground line-through decoration-foreground/30",
              )}
            >
              {text}
            </span>
            {due ? (
              <span className="mt-1 inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                Due {due}
              </span>
            ) : null}
          </span>
        </label>
      </BriefContextMenu>
      {canShowSource ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground"
          aria-label="Show note source"
          title="Show note source"
          onClick={onShowSource}
        >
          <FileSearch />
          <span className="hidden sm:inline">Show note source</span>
        </Button>
      ) : null}
    </div>
  );
}
