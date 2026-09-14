import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import type { ExampleMeeting } from "@/lib/examples.ts";

const typeLabel = {
  internal: "Internal",
  client: "Client",
  technical: "Technical",
} as const;

type ExampleMeetingCardProps = {
  meeting: ExampleMeeting;
  disabled?: boolean;
  onAnalyse: (meeting: ExampleMeeting) => void;
};

export function ExampleMeetingCard({
  meeting,
  disabled,
  onAnalyse,
}: ExampleMeetingCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <Badge variant={meeting.meetingType}>{typeLabel[meeting.meetingType]}</Badge>
          <span className="text-xs text-muted-foreground">{meeting.date}</span>
        </div>
        <CardTitle className="font-serif text-[1.15rem]">{meeting.title}</CardTitle>
        <CardDescription>{meeting.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button
          className="w-full"
          disabled={disabled}
          onClick={() => onAnalyse(meeting)}
        >
          Analyse meeting
        </Button>
      </CardContent>
    </Card>
  );
}
