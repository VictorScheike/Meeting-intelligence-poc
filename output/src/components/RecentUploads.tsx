import { Clock3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import type { CachedBrief } from "@/lib/brief-cache.ts";

type RecentUploadsProps = {
  items: CachedBrief[];
  disabled?: boolean;
  onOpen: (brief: CachedBrief) => void;
};

function formatWhen(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function RecentUploads({ items, disabled, onOpen }: RecentUploadsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Latest uploads</h2>
        <p className="text-sm text-muted-foreground">
          Briefs from files you analysed in this browser are kept locally.
        </p>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <Card key={item.id} className="min-w-0">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <div className="min-w-0">
                  <CardTitle className="truncate text-base font-medium">
                    {item.fileName ?? item.label}
                  </CardTitle>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {formatWhen(item.createdAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
                disabled={disabled}
                onClick={() => onOpen(item)}
              >
                Open Brief
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {item.report.shortSummary}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
