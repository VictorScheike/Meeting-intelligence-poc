import { FileText, Upload, X } from "lucide-react";
import { useId, useState, type DragEvent, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { TRANSCRIPT_MAX_FILE_BYTES } from "@/lib/constants.ts";
import { isTxtFileName } from "@/lib/transcript.ts";
import { cn } from "@/lib/utils.ts";

type TranscriptUploadProps = {
  disabled?: boolean;
  onGenerate: (transcript: string) => void;
  onInvalid: (message: string) => void;
};

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
}

export function TranscriptUpload({
  disabled,
  onGenerate,
  onInvalid,
}: TranscriptUploadProps) {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function acceptFile(next: File | undefined) {
    if (!next) {
      return;
    }
    if (!isTxtFileName(next.name)) {
      onInvalid("Only .txt transcripts are supported.");
      return;
    }
    if (next.size > TRANSCRIPT_MAX_FILE_BYTES) {
      onInvalid("The file is larger than 100 KB.");
      return;
    }
    setFile(next);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 1) {
      onInvalid("Upload one .txt file at a time.");
      event.target.value = "";
      return;
    }
    acceptFile(files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const files = event.dataTransfer.files;
    if (files.length > 1) {
      onInvalid("Upload one .txt file at a time.");
      return;
    }
    acceptFile(files[0]);
  }

  async function generate() {
    if (!file) {
      onInvalid("Choose a .txt transcript first.");
      return;
    }
    const text = await file.text();
    onGenerate(text);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Upload a transcript</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          id={inputId}
          type="file"
          accept=".txt,text/plain"
          className="sr-only"
          disabled={disabled}
          onChange={onInputChange}
        />
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors",
            dragging && "border-accent bg-accent/5",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <Upload className="mb-3 h-6 w-6 text-accent" aria-hidden="true" />
          <p className="text-sm font-medium">Drop a .txt file here, or browse</p>
          <p className="mt-1 text-xs text-muted-foreground">
            One file, UTF-8 text, 100 KB maximum. The original file is never stored.
          </p>
        </label>

        {file ? (
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove selected file"
              disabled={disabled}
              onClick={() => setFile(null)}
            >
              <X />
            </Button>
          </div>
        ) : null}

        <Button className="w-full" disabled={disabled || !file} onClick={() => void generate()}>
          Generate meeting brief
        </Button>
      </CardContent>
    </Card>
  );
}
