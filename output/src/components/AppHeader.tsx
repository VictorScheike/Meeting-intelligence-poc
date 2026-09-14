import { Layers, LogOut, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";

type AppHeaderProps = {
  onHome: () => void;
  onLogout: () => void;
  onOpenFeatures?: () => void;
};

export function AppHeader({ onHome, onLogout, onOpenFeatures }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-2 gap-y-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-x-4">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 rounded-lg text-left outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring sm:gap-3"
          aria-label="Back to home"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NotebookPen className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">
              Meeting Intelligence
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Clear decisions from Original meeting notes
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {onOpenFeatures ? (
            <Button variant="ghost" size="sm" className="min-h-10 sm:min-h-8" onClick={onOpenFeatures}>
              <Layers />
              <span className="hidden sm:inline">How it’s built</span>
              <span className="sm:hidden">Features</span>
            </Button>
          ) : null}
          <Badge variant="accent" className="hidden sm:inline-flex">
            Private demo
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="min-h-10 sm:min-h-8"
            aria-label="Logout"
            onClick={onLogout}
          >
            <LogOut />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
