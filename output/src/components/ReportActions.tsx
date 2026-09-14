import { Copy, Mail } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type ReportActionsProps = {
  disabled?: boolean;
  onCopy: () => void;
  onEmail: () => void;
};

export function ReportActions({ disabled, onCopy, onEmail }: ReportActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={disabled} onClick={onCopy}>
        <Copy />
        Copy brief
      </Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={onEmail}>
        <Mail />
        Send email
      </Button>
    </div>
  );
}
