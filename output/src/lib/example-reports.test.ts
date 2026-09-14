import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseReportMarkdown } from "./markdown.ts";

const resultsDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../results");

describe("committed example reports", () => {
  it("parses all three pre-generated briefs", () => {
    const roadmap = parseReportMarkdown(
      readFileSync(resolve(resultsDir, "q1-2024-product-roadmap.md"), "utf8"),
      "internal",
    );
    const nordea = parseReportMarkdown(
      readFileSync(resolve(resultsDir, "nordea-implementation-kickoff.md"), "utf8"),
      "client",
    );
    const payments = parseReportMarkdown(
      readFileSync(
        resolve(resultsDir, "payment-service-architecture-review.md"),
        "utf8",
      ),
      "technical",
    );

    expect(roadmap.title).toContain("Product Roadmap");
    expect(roadmap.people.length).toBeGreaterThan(0);
    expect(nordea.meetingType).toBe("client");
    expect(nordea.people.some((person) => person.name === "Louise Berg")).toBe(true);
    expect(payments.meetingType).toBe("technical");
    expect(payments.conclusion.length).toBeGreaterThan(20);
  });
});
