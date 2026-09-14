import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { AnalysisSkeleton } from "@/components/AnalysisSkeleton.tsx";
import { AppHeader } from "@/components/AppHeader.tsx";
import { analyzeTranscript, getSession, logout, RequestError } from "@/lib/api.ts";
import type { MeetingReport } from "@/lib/report-schema.ts";
import { HomePage } from "@/pages/HomePage.tsx";
import { LoginPage } from "@/pages/LoginPage.tsx";
import { ResultPage } from "@/pages/ResultPage.tsx";

type View = "boot" | "login" | "home" | "analyzing" | "result";

export default function App() {
  const [view, setView] = useState<View>("boot");
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    void (async () => {
      const authenticated = await getSession();
      setView(authenticated ? "home" : "login");
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

  async function runAnalysis(transcript: string) {
    setView("analyzing");
    setMessageIndex(0);
    try {
      const result = await analyzeTranscript(transcript);
      if (!result.ok) {
        toast.error("This file does not appear to be a meeting transcript.");
        setView("home");
        return;
      }
      setReport(result);
      setView("result");
    } catch (error) {
      if (error instanceof RequestError && error.status === 401) {
        toast.error("Your session has expired. Please sign in again.");
        setReport(null);
        setView("login");
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
    setView("login");
  }

  if (view === "boot") {
    return <div className="min-h-svh bg-background" />;
  }

  if (view === "login") {
    return (
      <>
        <Toaster position="top-center" richColors={false} />
        <LoginPage
          onSuccess={() => setView("home")}
          onError={(message) => toast.error(message)}
        />
      </>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <Toaster position="top-center" richColors={false} />
      <AppHeader onLogout={() => void handleLogout()} />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        {view === "home" ? (
          <HomePage
            busy={false}
            onOpenExample={(nextReport) => {
              setReport(nextReport);
              setView("result");
            }}
            onAnalyse={(transcript) => void runAnalysis(transcript)}
            onInvalid={(message) => toast.error(message)}
          />
        ) : null}
        {view === "analyzing" ? <AnalysisSkeleton messageIndex={messageIndex} /> : null}
        {view === "result" && report ? (
          <ResultPage report={report} onBack={() => setView("home")} />
        ) : null}
      </main>
    </div>
  );
}
