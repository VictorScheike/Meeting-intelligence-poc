import { Copy, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import type { MeetingReport } from "@/lib/report-schema.ts";
import { checklistKey, readChecklistItem, writeChecklistItem } from "@/lib/storage.ts";
import { cn } from "@/lib/utils.ts";

type PersonChecklistProps = {
  report: MeetingReport;
  person: MeetingReport["people"][number];
  onCopy: () => void;
  onEmail: () => void;
};

export function PersonChecklist({
  report,
  person,
  onCopy,
  onEmail,
}: PersonChecklistProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="font-serif">{person.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {person.nextSteps.length} next step{person.nextSteps.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            <Copy />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={onEmail}>
            <Mail />
            Email
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
}: {
  storageKey: string;
  text: string;
  due?: string;
}) {
  const [checked, setChecked] = useState(() => readChecklistItem(storageKey));

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 hover:bg-muted/60">
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
  );
}
