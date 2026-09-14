import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const MESSAGES = [
  "Turning the transcript into a clear meeting brief...",
  "Identifying decisions",
  "Organising next steps",
];

type AnalysisSkeletonProps = {
  messageIndex: number;
};

export function AnalysisSkeleton({ messageIndex }: AnalysisSkeletonProps) {
  const message = MESSAGES[messageIndex % MESSAGES.length] ?? MESSAGES[0];

  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-accent">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
      <div className="grid gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
