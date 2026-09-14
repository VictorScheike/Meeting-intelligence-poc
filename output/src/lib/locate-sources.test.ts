import { describe, expect, it } from "vitest";
import {
  locateSources,
  locateTaskSources,
  splitHighlighted,
} from "./locate-sources.ts";

const transcript = `[00:04:45] Sarah Jensen: What's the difference in timeline?
[00:05:00] Michael Andersen: If we build specific integrations, we could ship Economic by end of February.
[00:06:20] Line Petersen: I'd vote for the framework approach. We have four engineers who could work on this.
[00:08:15] Thomas Nielsen: I will document the specific mobile use cases being heard.`;

describe("locateSources", () => {
  it("finds one or more verbatim quotes", () => {
    const spans = locateSources(transcript, [
      "I'd vote for the framework approach",
      "document the specific mobile use cases",
    ]);
    expect(spans.length).toBe(2);
    expect(transcript.slice(spans[0]!.start, spans[0]!.end)).toContain("framework approach");
    expect(transcript.slice(spans[1]!.start, spans[1]!.end)).toContain("mobile use cases");
  });

  it("matches model quotes that include wrapping quotation marks", () => {
    const spans = locateTaskSources(transcript, {
      text: "Document the specific mobile use cases being heard",
      sources: [
        "\"Thomas Nielsen: I will document the specific mobile use cases being heard.\"",
        "“I will document the specific mobile use cases”",
      ],
    });
    expect(spans.length).toBeGreaterThan(0);
    const matched = spans
      .map((span) => transcript.slice(span.start, span.end))
      .join("\n");
    expect(matched).toContain("document the specific mobile use cases");
    expect(matched).not.toContain("Economic");
  });

  it("falls back to matching task language in speaker lines", () => {
    const spans = locateTaskSources(transcript, {
      text: "Share a detailed timeline for the Economic integration",
      personName: "Michael Andersen",
    });
    expect(spans.length).toBeGreaterThan(0);
    const matched = spans.map((span) => transcript.slice(span.start, span.end)).join("\n");
    expect(matched).toContain("Economic");
  });
});

describe("splitHighlighted", () => {
  it("keeps surrounding text and marks the matches", () => {
    const parts = splitHighlighted("alpha beta gamma", [{ start: 6, end: 10 }]);
    expect(parts).toEqual([
      { text: "alpha ", highlight: false },
      { text: "beta", highlight: true },
      { text: " gamma", highlight: false },
    ]);
  });
});
