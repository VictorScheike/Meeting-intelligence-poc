import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractMeetingReport } from "../src/lib/analyze.ts";
import { formatReportMarkdown } from "../src/lib/markdown.ts";
import { validateTranscript } from "../src/lib/transcript.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputRoot = resolve(scriptDir, "..");
const repoRoot = resolve(outputRoot, "..");
const inputDir = resolve(repoRoot, "Input");
const resultsDir = resolve(outputRoot, "results");
const devVarsPath = resolve(outputRoot, ".dev.vars");

const JOBS = [
  {
    source: "meeting_1_product_roadmap.txt",
    target: "q1-2024-product-roadmap.md",
  },
  {
    source: "meeting_2_client_onboarding.txt",
    target: "nordea-implementation-kickoff.md",
  },
  {
    source: "meeting_3_technical_architecture.txt",
    target: "payment-service-architecture-review.md",
  },
] as const;

function loadDevVars(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) {
    throw new Error(
      "Missing .dev.vars. Copy .dev.vars.example to .dev.vars and add the required secrets.",
    );
  }

  const values: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function main() {
  const vars = loadDevVars(devVarsPath);
  const apiKey = vars.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing in .dev.vars.");
  }

  if (!existsSync(inputDir)) {
    throw new Error(`Transcript folder not found at ${inputDir}.`);
  }

  await mkdir(resultsDir, { recursive: true });

  for (const job of JOBS) {
    const sourcePath = resolve(inputDir, job.source);
    if (!existsSync(sourcePath)) {
      throw new Error(`Required transcript is missing: ${job.source}`);
    }

    const transcript = await readFile(sourcePath, "utf8");
    const validation = validateTranscript(transcript);
    if (!validation.ok) {
      throw new Error(`${job.source} failed transcript validation: ${validation.message}`);
    }

    console.log(`Analysing ${job.source}...`);
    const result = await extractMeetingReport(transcript, apiKey);
    if (!result.ok) {
      throw new Error(`${job.source} was classified as not a transcript.`);
    }

    const markdown = `${formatReportMarkdown(result).trim()}\n\n---\n\n_This report was generated and validated through the same shared schema used by the Meeting Intelligence application._\n`;
    const targetPath = resolve(resultsDir, job.target);
    await writeFile(targetPath, markdown, "utf8");
    console.log(`Wrote results/${job.target}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Result generation failed.";
  console.error(message);
  process.exitCode = 1;
});
