import { cn } from "@/lib/utils.ts";

type AppFooterProps = {
  className?: string;
};

export function AppFooter({ className }: AppFooterProps) {
  return (
    <footer className={cn("border-t border-border bg-card/90", className)}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-muted-foreground">
        <span>Victor Scheike</span>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/VictorScheike/Meeting-intelligence-poc"
          target="_blank"
          rel="noreferrer noopener"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Source code
        </a>
      </div>
    </footer>
  );
}
