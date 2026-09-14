import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { AnalysisLoading } from "@/components/AnalysisLoading.tsx";
import { AppFooter } from "@/components/AppFooter.tsx";
import { AppHeader } from "@/components/AppHeader.tsx";
import {
  analyzeExample,
  analyzeTranscript,
  getSession,
  logout,
  RequestError,
} from "@/lib/api.ts";
import {
  listCachedUploads,
  saveCachedBrief,
  type CachedBrief,
} from "@/lib/brief-cache.ts";
import {
  exampleIdFromTitle,
  type ExampleId,
  type ExampleMeeting,
} from "@/lib/examples.ts";
import type { MeetingReport } from "@/lib/report-schema.ts";
import { validateTranscript } from "@/lib/transcript.ts";
import { FeaturesPage } from "@/pages/FeaturesPage.tsx";
import { HomePage } from "@/pages/HomePage.tsx";
import { LoginPage } from "@/pages/LoginPage.tsx";
import { ResultPage } from "@/pages/ResultPage.tsx";

type View = "boot" | "login" | "home" | "analyzing" | "result" | "features";
type ReturnView = Exclude<View, "boot" | "features">;

export default function App() {
  const [view, setView] = useState<View>("boot");
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [exampleId, setExampleId] = useState<ExampleId | undefined>();
  const [transcript, setTranscript] = useState<string | undefined>();
  const [uploads, setUploads] = useState<CachedBrief[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [canSendEmail, setCanSendEmail] = useState(false);
  const [returnView, setReturnView] = useState<ReturnView>("home");

  useEffect(() => {
    void (async () => {
      const session = await getSession();
      setCanSendEmail(session.canSendEmail);
      setView(session.authenticated ? "home" : "login");
      if (session.authenticated) {
        setUploads(listCachedUploads());
      }
    })();
  }, []);

  useEffect(() => {
    if (view !== "analyzing") {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const timer = window.setInterval(() => {
      setMessageIndex((index) => index + 1);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [view]);

  function showReport(
    next: MeetingReport,
    notes?: { exampleId?: ExampleId; transcript?: string },
  ) {
    setReport(next);
    setExampleId(notes?.exampleId);
    setTranscript(notes?.transcript);
    setView("result");
  }

  function openCachedBrief(brief: CachedBrief) {
    showReport(brief.report, {
      exampleId:
        brief.exampleId ??
        (brief.source === "example" ? exampleIdFromTitle(brief.report.title) : undefined),
      transcript: brief.transcript,
    });
  }

  function handleAuthExpired() {
    toast.error("Your session has expired. Please sign in again.");
    setReport(null);
    setExampleId(undefined);
    setTranscript(undefined);
    setView("login");
  }

  function goHome() {
    setView("home");
  }

  async function runUploadAnalysis(transcript: string, fileName: string) {
    const check = validateTranscript(transcript);
    if (!check.ok) {
      toast.error(check.message);
      setView("home");
      return;
    }
    setView("analyzing");
    setMessageIndex(0);
    try {
      const result = await analyzeTranscript(transcript);
      if (!result.ok) {
        toast.error(
          "This file is not Original meeting notes or a transcript, so a brief was not generated.",
        );
        setView("home");
        return;
      }
      const saved = saveCachedBrief({
        source: "upload",
        label: result.title,
        fileName,
        transcript,
        report: result,
      });
      setUploads(listCachedUploads());
      showReport(saved.report, { transcript });
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        handleAuthExpired();
        return;
      }
      const message =
        error instanceof RequestError
          ? error.message
          : "Analysis failed. Please try again.";
      toast.error(message);
      setView("home");
    }
  }

  async function runExampleAnalysis(meeting: ExampleMeeting) {
    setView("analyzing");
    setMessageIndex(0);
    try {
      const result = await analyzeExample(meeting.id);
      if (!result.ok) {
        toast.error(
          "This file is not Original meeting notes or a transcript, so a brief was not generated.",
        );
        setView("home");
        return;
      }
      saveCachedBrief({
        source: "example",
        label: result.title,
        exampleId: meeting.id,
        report: result,
      });
      showReport(result, { exampleId: meeting.id });
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        handleAuthExpired();
        return;
      }
      const message =
        error instanceof RequestError
          ? error.message
          : "Analysis failed. Please try again.";
      toast.error(message);
      setView("home");
    }
  }

  async function handleLogout() {
    await logout();
    setReport(null);
    setExampleId(undefined);
    setTranscript(undefined);
    setView("login");
  }

  function openFeatures() {
    if (view === "features" || view === "analyzing" || view === "boot") {
      return;
    }
    setReturnView(view);
    setView("features");
  }

  function closeFeatures() {
    setView(returnView);
  }

  if (view === "boot") {
    return <div className="min-h-svh bg-background" />;
  }

  if (view === "login") {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Toaster position="top-center" richColors={false} />
        <LoginPage
          onSuccess={() => {
            void (async () => {
              const session = await getSession();
              setCanSendEmail(session.canSendEmail);
              setUploads(listCachedUploads());
              setView("home");
            })();
          }}
          onError={(message) => toast.error(message)}
          onOpenFeatures={openFeatures}
        />
        <AppFooter />
      </div>
    );
  }

  if (view === "features" && returnView === "login") {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <Toaster position="top-center" richColors={false} />
        <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6 sm:py-8">
          <FeaturesPage onBack={closeFeatures} />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Toaster position="top-center" richColors={false} />
      <AppHeader
        onHome={goHome}
        onLogout={() => void handleLogout()}
        onOpenFeatures={view === "features" ? undefined : openFeatures}
      />
      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6 sm:py-8">
        {view === "home" ? (
          <HomePage
            busy={false}
            uploads={uploads}
            onGenerateExample={(meeting) => void runExampleAnalysis(meeting)}
            onOpenCached={openCachedBrief}
            onAnalyseUpload={(transcript, fileName) =>
              void runUploadAnalysis(transcript, fileName)
            }
            onInvalid={(message) => toast.error(message)}
            onAuthExpired={handleAuthExpired}
          />
        ) : null}
        {view === "analyzing" ? <AnalysisLoading messageIndex={messageIndex} /> : null}
        {view === "result" && report ? (
          <ResultPage
            report={report}
            exampleId={exampleId}
            transcript={transcript}
            canSendEmail={canSendEmail}
            onBack={goHome}
            onAuthExpired={handleAuthExpired}
          />
        ) : null}
        {view === "features" ? <FeaturesPage onBack={closeFeatures} /> : null}
      </main>
      <AppFooter />
    </div>
  );
}
