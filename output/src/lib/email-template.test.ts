import { createElement } from "react";
import { render } from "react-email";
import { describe, expect, it } from "vitest";
import MeetingBriefPersonEmail from "../../emails/meeting-brief-person.tsx";
import MeetingBriefEmail from "../../emails/meeting-brief.tsx";

describe("meeting brief email templates", () => {
  it("renders the full brief with summary, conclusion and next steps", async () => {
    const html = await render(
      createElement(MeetingBriefEmail, MeetingBriefEmail.PreviewProps),
    );

    expect(html).toContain("Q1 2024 Product Roadmap Planning");
    expect(html).toContain("Short summary");
    expect(html).toContain("Conclusion");
    expect(html).toContain("Line Petersen");
    expect(html).toContain("Due end of week");
    expect(html).toContain("lang=\"en\"");
  });

  it("renders a person checklist with the meeting conclusion for context", async () => {
    const html = await render(
      createElement(MeetingBriefPersonEmail, MeetingBriefPersonEmail.PreviewProps),
    );

    expect(html).toContain("Line Petersen");
    expect(html).toContain("Your next steps");
    expect(html).toContain("Why this matters");
  });
});
