import {
  ArrowLeft,
  CheckSquare,
  CircleAlert,
  Cloud,
  Copy,
  FileText,
  Gauge,
  HardDrive,
  LayoutGrid,
  ListChecks,
  Mail,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

type FeaturesPageProps = {
  onBack: () => void;
};

const PRODUCT_FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    icon: ShieldCheck,
    title: "Private demo login",
    body: "A shared password opens the workspace. Production sign-in uses Cloudflare Turnstile so bots cannot brute-force the demo. Local Vite skips the widget and prefills the password so Continue works without it.",
  },
  {
    icon: Sparkles,
    title: "Generate Brief",
    body: "Start from three sample meetings — Q1 roadmap planning, a Nordea kickoff, or a payments architecture review — or drop in your own .txt meeting notes (UTF-8, 100 KB max).",
  },
  {
    icon: CircleAlert,
    title: "Uploads must be meeting notes",
    body: "A file is checked for speaker names or timestamps before anything is sent to the model. Files that look like AI commands rather than a meeting are rejected and no brief is generated. Uploaded text is wrapped as untrusted content so instructions inside it are not followed. Real meetings that mention those phrases are still analysed. The Worker repeats the same checks.",
  },
  {
    icon: ListChecks,
    title: "Structured outcome",
    body: "Each brief includes a title, date, meeting type, short summary, conclusion, and next steps grouped by named person. The Worker calls OpenAI; the browser never holds the API key.",
  },
  {
    icon: FileText,
    title: "Original meeting notes",
    body: "Open Original meeting notes from a sample meeting (a modal) or from a generated brief. On the brief page they sit in a side overlay, so the brief still scrolls underneath. Each next step has Show note source, which highlights matching passages.",
  },
  {
    icon: CheckSquare,
    title: "Personal checklists",
    body: "Tick next steps as you work. Checklist state stays in this browser’s localStorage and is never sent to the server.",
  },
  {
    icon: Copy,
    title: "Copy and send email",
    body: "Copy a full brief, a person’s checklist, or a single next step. Send email opens a recipient dialog. The Worker always sends through Resend’s published Meeting brief template. If Resend is not configured, the dialog shows an error instead of opening a mail client. Send is limited to five emails per minute per session.",
  },
  {
    icon: Gauge,
    title: "Email rate limit",
    body: "A Cloudflare Workers rate-limit binding sits in front of POST /api/send-brief. Extra sends return 429 until the one-minute window resets, so the demo inbox cannot be abused.",
  },
  {
    icon: MousePointerClick,
    title: "Right-click actions",
    body: "Right-click a next step for Copy, Send email, and Show note source. Person cards use the Copy and Send email buttons on the card, not a context menu.",
  },
  {
    icon: HardDrive,
    title: "Latest uploads",
    body: "Briefs from files you analysed in this browser are kept locally (up to 12). Latest uploads on the home page reopen them without sending the file again.",
  },
];

const STACK: Array<{
  title: string;
  items: string[];
}> = [
  {
    title: "Interface",
    items: [
      "Vite, React 19, and TypeScript",
      "Tailwind CSS with serif headings and a warm paper palette",
      "shadcn-style UI: Radix checkbox, label, and slot; Base UI context menu",
      "Responsive layout for small screens, including the header, cards, and notes overlay",
      "Lucide icons and the ldrs Quantum spinner while a brief is generated",
    ],
  },
  {
    title: "Edge backend",
    items: [
      "Cloudflare Workers with Hono, served through the official Cloudflare Vite plugin",
      "OpenAI (gpt-4o-mini) from the Worker only, with a strict JSON schema",
      "Zod validation for login, analysis, and email payloads",
      "Cloudflare Turnstile on production login (skipped in local Vite), plus a signed session cookie",
      "Cloudflare rate limiting on brief email (5 sends per minute per session)",
    ],
  },
  {
    title: "Share and quality",
    items: [
      "React Email templates in the repo for authoring; outbound mail uses Resend’s published Meeting brief template",
      "Vitest for unit tests, oxlint for lint, and Wrangler for types and deploy",
    ],
  },
];

export function FeaturesPage({ onBack }: FeaturesPageProps) {
  return (
    <div className="space-y-10 min-w-0">
      <div>
        <Button variant="ghost" className="-ml-2" onClick={onBack}>
          <ArrowLeft />
          Back
        </Button>
        <section className="mt-4 max-w-3xl">
          <p className="text-sm font-medium text-accent">How it’s built</p>
          <h1 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl md:text-4xl">
            Features, tools, and the stack behind Meeting Intelligence
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            This private demo turns Original meeting notes into decisions and named next
            steps. Everything below is what this app actually ships — not a
            wishlist.
          </p>
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">What you can do</h2>
          <p className="text-sm text-muted-foreground">
            From sign-in through a generated brief, sharing, and local follow-up.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRODUCT_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Tools in this repo</h2>
          <p className="text-sm text-muted-foreground">
            Verified against package.json, Wrangler config, the Worker, and the UI
            packages in use.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((group) => (
            <Card key={group.title} className="h-full min-w-0">
              <CardHeader>
                <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  {group.title === "Edge backend" ? (
                    <Cloud className="h-4 w-4" aria-hidden="true" />
                  ) : group.title === "Share and quality" ? (
                    <Mail className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>
                <CardTitle className="font-serif">{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full min-w-0">
      <CardHeader>
        <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-accent">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <CardTitle className="font-serif">{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
    </Card>
  );
}
