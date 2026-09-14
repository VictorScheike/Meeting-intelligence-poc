import { describe, expect, it } from "vitest";
import { formatPersonMarkdown, formatReportMarkdown } from "./markdown.ts";
import type { MeetingReport } from "./report-schema.ts";

const report: MeetingReport = {
  ok: true,
  title: "Q1 2024 Product Roadmap Planning",
  date: "15 January 2024",
  meetingType: "internal",
  shortSummary: "The team locked Q1 priorities.",
  conclusion: "Build an integration framework before one-off connectors.",
  people: [
    {
      name: "Line Petersen",
      nextSteps: [{ text: "Share a detailed timeline", due: "end of week" }],
    },
    {
      name: "Thomas Nielsen",
      nextSteps: [{ text: "Document mobile use cases" }],
    },
  ],
};

describe("markdown formatting", () => {
  it("formats a complete report", () => {
    expect(formatReportMarkdown(report)).toBe(`# Q1 2024 Product Roadmap Planning
15 January 2024

## Short summary
The team locked Q1 priorities.

## Conclusion
Build an integration framework before one-off connectors.

## Next steps

### Line Petersen
- [ ] Share a detailed timeline (end of week)

### Thomas Nielsen
- [ ] Document mobile use cases
`);
  });

  it("formats one person's checklist", () => {
    expect(formatPersonMarkdown(report, "Line Petersen")).toBe(`### Line Petersen
- [ ] Share a detailed timeline (end of week)
`);
  });

  it("handles an empty next-step list", () => {
    const emptyReport: MeetingReport = { ...report, people: [] };
    expect(formatReportMarkdown(emptyReport)).toContain(
      "_No named next steps were assigned in this transcript._",
    );
  });
});
