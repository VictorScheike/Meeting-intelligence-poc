import { Quantum } from "ldrs/react";
import "ldrs/react/Quantum.css";

const MESSAGES = [
  "Turning the meeting into a clear brief...",
  "Identifying decisions",
  "Organising next steps",
];

type AnalysisLoadingProps = {
  messageIndex: number;
};

export function AnalysisLoading({ messageIndex }: AnalysisLoadingProps) {
  const message = MESSAGES[messageIndex % MESSAGES.length] ?? MESSAGES[0];

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center"
      aria-live="polite"
      aria-busy="true"
    >
      <Quantum size="45" speed="1.75" color="black" />
      <div className="space-y-2">
        <h1 className="font-serif text-2xl tracking-tight">Generating Brief</h1>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
