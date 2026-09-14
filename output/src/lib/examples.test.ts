import { describe, expect, it } from "vitest";
import { exampleIdFromTitle, isExampleId } from "./examples.ts";

describe("example meeting helpers", () => {
  it("recognises bundled example ids", () => {
    expect(isExampleId("roadmap")).toBe(true);
    expect(isExampleId("payments")).toBe(true);
    expect(isExampleId("other")).toBe(false);
  });

  it("recovers an example id from a generated title", () => {
    expect(exampleIdFromTitle("Q1 2024 Product Roadmap Planning")).toBe("roadmap");
    expect(exampleIdFromTitle("Nordea Bank - Implementation Kickoff")).toBe("nordea");
    expect(exampleIdFromTitle("Payment Service Architecture Review")).toBe("payments");
    expect(exampleIdFromTitle("Weekly standup")).toBeUndefined();
  });
});
