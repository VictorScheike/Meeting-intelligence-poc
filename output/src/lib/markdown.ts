import type { MeetingReport } from "./report-schema.ts";

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
    lines.push("", "_No named next steps were assigned in this transcript._");
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
