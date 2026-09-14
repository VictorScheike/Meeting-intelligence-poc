import {
  meetingReportSuccessSchema,
  normalizeAnalyzeResult,
  usableDue,
  type MeetingReport,
} from "./report-schema.ts";

function formatStep(text: string, due?: string): string {
  return due ? `- [ ] ${text} (${due})` : `- [ ] ${text}`;
}

export function formatReportMarkdown(report: MeetingReport): string {
  const lines = [
    `# ${report.title}`,
    report.date,
    "",
    "## Short summary",
    report.shortSummary,
    "",
    "## Conclusion",
    report.conclusion,
    "",
    "## Next steps",
  ];

  const peopleWithSteps = report.people.filter(
    (person) => person.nextSteps.length > 0,
  );

  if (peopleWithSteps.length === 0) {
    lines.push("", "_No named next steps were assigned in this brief._");
  } else {
    for (const person of peopleWithSteps) {
      lines.push("", `### ${person.name}`);
      for (const step of person.nextSteps) {
        lines.push(formatStep(step.text, step.due));
      }
    }
  }

  return `${lines.join("\n")}\n`;
}

export function formatPersonMarkdown(
  report: MeetingReport,
  personName: string,
): string {
  const person = report.people.find((entry) => entry.name === personName);
  const lines = [`### ${personName}`];

  if (!person || person.nextSteps.length === 0) {
    lines.push("_No named next steps were assigned to this person._");
    return `${lines.join("\n")}\n`;
  }

  for (const step of person.nextSteps) {
    lines.push(formatStep(step.text, step.due));
  }

  return `${lines.join("\n")}\n`;
}

export function parseReportMarkdown(
  markdown: string,
  meetingType: MeetingReport["meetingType"],
): MeetingReport {
  const cleaned = markdown.replaceAll("\r\n", "\n").trim();
  const withoutFooter = cleaned.replace(/\n---\n[\s\S]*$/, "").trim();
  const lines = withoutFooter.split("\n");
  const title = lines[0]?.replace(/^#\s+/, "").trim();
  const date = lines[1]?.trim();

  if (!title || !date) {
    throw new Error("REPORT_MARKDOWN_INVALID");
  }

  const parsed = meetingReportSuccessSchema.safeParse({
    ok: true,
    title,
    date,
    meetingType,
    shortSummary: readSection(withoutFooter, "Short summary", "Conclusion"),
    conclusion: readSection(withoutFooter, "Conclusion", "Next steps"),
    people: parsePeople(readSection(withoutFooter, "Next steps", null)),
  });

  if (!parsed.success) {
    throw new Error("REPORT_MARKDOWN_INVALID");
  }

  const result = normalizeAnalyzeResult(parsed.data);
  if (!result.ok) {
    throw new Error("REPORT_MARKDOWN_INVALID");
  }
  return result;
}

function readSection(
  markdown: string,
  heading: string,
  nextHeading: string | null,
): string {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  if (start === -1) {
    throw new Error("REPORT_MARKDOWN_INVALID");
  }

  const afterHeading = markdown.slice(start + marker.length);
  const nextIndex =
    nextHeading === null ? -1 : afterHeading.indexOf(`## ${nextHeading}`);
  return (nextIndex === -1 ? afterHeading : afterHeading.slice(0, nextIndex)).trim();
}

function parsePeople(
  nextStepsBlock: string,
): Array<{ name: string; nextSteps: Array<{ text: string; due: string | null }> }> {
  if (
    nextStepsBlock.length === 0 ||
    nextStepsBlock.includes("No named next steps were assigned")
  ) {
    return [];
  }

  const people: Array<{
    name: string;
    nextSteps: Array<{ text: string; due: string | null }>;
  }> = [];
  let current: (typeof people)[number] | undefined;

  for (const line of nextStepsBlock.split("\n")) {
    const heading = line.match(/^###\s+(.+)$/);
    if (heading?.[1]) {
      current = { name: heading[1].trim(), nextSteps: [] };
      people.push(current);
      continue;
    }

    const task = line.match(/^- \[[ xX]\]\s+(.+)$/);
    if (!task?.[1] || !current) {
      continue;
    }

    const parsedTask = parseTaskText(task[1].trim());
    current.nextSteps.push({
      text: parsedTask.text,
      due: parsedTask.due ?? null,
    });
  }

  return people;
}

function parseTaskText(value: string): { text: string; due?: string } {
  const match = value.match(/^(.*) \(([^)]+)\)\s*$/);
  if (!match?.[1] || !match[2]) {
    return { text: value };
  }

  const due = usableDue(match[2]);
  return due ? { text: match[1].trim(), due } : { text: match[1].trim() };
}
