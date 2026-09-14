import { FileText } from "lucide-react";
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
  onGenerate: (meeting: ExampleMeeting) => void;
  onReadNotes: (meeting: ExampleMeeting) => void;
};

export function ExampleMeetingCard({
  meeting,
  disabled,
  onGenerate,
  onReadNotes,
}: ExampleMeetingCardProps) {
  return (
    <Card className="flex h-full min-w-0 flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant={meeting.meetingType}>{typeLabel[meeting.meetingType]}</Badge>
          <span className="text-xs text-muted-foreground">{meeting.date}</span>
        </div>
        <CardTitle className="font-serif text-[1.15rem]">{meeting.title}</CardTitle>
        <CardDescription>{meeting.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-2">
        <Button className="w-full" disabled={disabled} onClick={() => onGenerate(meeting)}>
          Generate Brief
        </Button>
        <Button
          className="w-full"
          variant="outline"
          disabled={disabled}
          onClick={() => onReadNotes(meeting)}
        >
          <FileText />
          Original meeting notes
        </Button>
      </CardContent>
    </Card>
  );
}
