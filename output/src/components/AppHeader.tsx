import { LogOut, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";

type AppHeaderProps = {
  onLogout: () => void;
};

export function AppHeader({ onLogout }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NotebookPen className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Meeting Intelligence</p>
            <p className="text-xs text-muted-foreground">Clear decisions from transcripts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">Private demo</Badge>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
