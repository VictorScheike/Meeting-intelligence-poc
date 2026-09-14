import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { invalidRecipients, parseRecipientList } from "@/lib/email.ts";

type SendBriefDialogProps = {
  open: boolean;
  title: string;
  description: string;
  sending: boolean;
  canSendEmail: boolean;
  onClose: () => void;
  onSend: (recipients: string[]) => Promise<void>;
};

export function SendBriefDialog({
  open,
  title,
  description,
  sending,
  canSendEmail,
  onClose,
  onSend,
}: SendBriefDialogProps) {
  const [recipients, setRecipients] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (sending) {
      return;
    }
    onClose();
  }

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, sending, onClose]);

  if (!open) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emails = parseRecipientList(recipients);
    if (emails.length === 0) {
      setError("Enter at least one email address.");
      return;
    }
    if (emails.length > 10) {
      setError("Send to at most 10 addresses at a time.");
      return;
    }
    const invalid = invalidRecipients(emails);
    if (invalid.length > 0) {
      setError(`This does not look like an email address: ${invalid[0]}`);
      return;
    }

    setError(null);
    try {
      await onSend(emails);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "The email could not be sent. Please try again.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40"
        aria-label="Close email dialog"
        disabled={sending}
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-brief-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-xl sm:pb-0"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 id="send-brief-title" className="font-serif text-xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Close"
            disabled={sending}
            onClick={handleClose}
          >
            <X />
          </Button>
        </div>
        <form className="space-y-4 px-4 py-4 sm:px-5" onSubmit={(event) => void onSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="brief-recipients">Recipients</Label>
            <Input
              id="brief-recipients"
              name="recipients"
              type="text"
              autoComplete="email"
              placeholder="ada@example.com, bob@example.com"
              value={recipients}
              onChange={(event) => {
                setRecipients(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Separate addresses with commas.{" "}
              {canSendEmail
                ? "Meeting Intelligence will send the formatted brief with Resend."
                : "Email sending is not configured on this server. Resend must be set up before a brief can be sent."}
            </p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={sending}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={sending}>
              {sending ? "Sending..." : "Send email"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
