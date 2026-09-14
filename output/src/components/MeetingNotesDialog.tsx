import { X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Quantum } from "ldrs/react";
import "ldrs/react/Quantum.css";
import { Button } from "@/components/ui/button.tsx";
import { splitHighlighted, type TextSpan } from "@/lib/locate-sources.ts";
import { cn } from "@/lib/utils.ts";

type MeetingNotesDialogProps = {
  open: boolean;
  title: string;
  date?: string;
  notes: string;
  loading?: boolean;
  highlights?: TextSpan[];
  variant?: "modal" | "overlay";
  onClose: () => void;
};

export function MeetingNotesDialog({
  open,
  title,
  date,
  notes,
  loading,
  highlights = [],
  variant = "modal",
  onClose,
}: MeetingNotesDialogProps) {
  const overlay = variant === "overlay";

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);

    let previous: string | undefined;
    if (!overlay) {
      previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (previous !== undefined) {
        document.body.style.overflow = previous;
      }
      window.removeEventListener("keydown", onKey);
    };
  }, [open, overlay, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed z-50",
        overlay
          ? "pointer-events-none inset-x-0 bottom-0 h-[min(52vh,28rem)] md:inset-auto md:right-0 md:top-16 md:h-[calc(100dvh-4rem)] md:w-[min(32rem,100%)]"
          : "inset-0 flex items-end justify-center p-3 sm:items-center sm:p-4",
      )}
    >
      {overlay ? null : (
        <button
          type="button"
          className="absolute inset-0 bg-foreground/40"
          aria-label="Close Original meeting notes"
          onClick={onClose}
        />
      )}
      <div
        role="dialog"
        aria-modal={!overlay}
        aria-labelledby="meeting-brief-title"
        className={cn(
          "pointer-events-auto flex flex-col overflow-hidden border border-border bg-card shadow-xl",
          overlay
            ? "h-full w-full rounded-t-xl border-b-0 pb-[env(safe-area-inset-bottom)] md:rounded-none md:rounded-l-xl md:border-y-0 md:border-r-0 md:pb-0"
            : "relative z-10 max-h-[min(85dvh,85vh)] w-full max-w-3xl rounded-t-xl pb-[env(safe-area-inset-bottom)] sm:rounded-xl sm:pb-0",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Original meeting notes
            </p>
            <h2 id="meeting-brief-title" className="font-serif text-xl">
              {title}
            </h2>
            {date ? (
              <p className="mt-1 text-sm text-muted-foreground">{date}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label="Close" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 bg-muted/40 p-4">
          <div
            className={cn(
              "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-inner",
              overlay ? "" : "h-[min(32rem,calc(85vh-5.5rem))]",
            )}
          >
            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <Quantum size="45" speed="1.75" color="black" />
                <p className="text-sm text-muted-foreground">Loading Original meeting notes...</p>
              </div>
            ) : (
              <HighlightedNotes text={notes} highlights={highlights} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HighlightedNotes({
  text,
  highlights,
}: {
  text: string;
  highlights: TextSpan[];
}) {
  const firstMark = useRef<HTMLElement>(null);
  const parts = useMemo(
    () => splitHighlighted(text, highlights),
    [text, highlights],
  );

  useEffect(() => {
    firstMark.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [text, highlights]);

  const firstHighlight = parts.findIndex((part) => part.highlight);

  return (
    <pre className="h-full overflow-auto whitespace-pre-wrap p-4 font-sans text-sm leading-relaxed text-foreground">
      {parts.map((part, index) => {
        if (!part.highlight) {
          return <span key={index}>{part.text}</span>;
        }
        return (
          <mark
            key={index}
            ref={index === firstHighlight ? firstMark : undefined}
            className="rounded-sm bg-[color-mix(in_srgb,var(--color-accent)_30%,white)] px-0.5 text-foreground"
          >
            {part.text}
          </mark>
        );
      })}
    </pre>
  );
}
