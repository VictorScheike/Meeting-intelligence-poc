import { z } from "zod";

const nextStepSchema = z.object({
  text: z.string().min(1).max(400),
  due: z.union([z.string().max(80), z.null()]),
  sources: z.optional(z.array(z.string().min(1).max(400)).max(8)),
});

const personSchema = z.object({
  name: z.string().min(1).max(80),
  nextSteps: z.array(nextStepSchema).max(20),
});

export const meetingReportSuccessSchema = z.object({
  ok: z.literal(true),
  title: z.string().min(1).max(200),
  date: z.string().min(1).max(40),
  meetingType: z.enum(["internal", "client", "technical"]),
  shortSummary: z.string().min(1).max(2000),
  conclusion: z.string().min(1).max(2000),
  people: z.array(personSchema).max(30),
});

export const notTranscriptSchema = z.object({
  ok: z.literal(false),
  error: z.literal("not_a_transcript"),
});

export const analyzeResultSchema = z.discriminatedUnion("ok", [
  meetingReportSuccessSchema,
  notTranscriptSchema,
]);

export const loginRequestSchema = z.strictObject({
  password: z.string().min(1).max(200),
  "cf-turnstile-response": z.string().min(1).max(2048),
});

export const analyzeRequestSchema = z.strictObject({
  transcript: z.string(),
});

export const analyzeExampleRequestSchema = z.strictObject({
  exampleId: z.enum(["roadmap", "nordea", "payments"]),
});

export type MeetingReport = {
  ok: true;
  title: string;
  date: string;
  meetingType: "internal" | "client" | "technical";
  shortSummary: string;
  conclusion: string;
  people: Array<{
    name: string;
    nextSteps: Array<{
      text: string;
      due?: string;
      sources?: string[];
    }>;
  }>;
};

export type NotTranscript = z.infer<typeof notTranscriptSchema>;
export type AnalyzeResult = MeetingReport | NotTranscript;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export function usableDue(value: string | null | undefined): string | undefined {
  const due = value?.trim();
  if (!due || due.toLowerCase() === "null") {
    return undefined;
  }
  return due;
}

export function normalizeAnalyzeResult(
  value: z.infer<typeof analyzeResultSchema>,
): AnalyzeResult {
  if (!value.ok) {
    return value;
  }

  return {
    ok: true,
    title: value.title,
    date: value.date,
    meetingType: value.meetingType,
    shortSummary: value.shortSummary,
    conclusion: value.conclusion,
    people: value.people.map((person) => ({
      name: person.name,
      nextSteps: person.nextSteps.map((step) => {
        const due = usableDue(step.due);
        const sources = (step.sources ?? [])
          .map((quote) => quote.trim())
          .filter((quote) => quote.length > 0);
        return {
          text: step.text,
          ...(due ? { due } : {}),
          ...(sources.length > 0 ? { sources } : {}),
        };
      }),
    })),
  };
}

export const OPENAI_REPORT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ok: { type: "boolean" },
    error: {
      anyOf: [{ type: "string", enum: ["not_a_transcript"] }, { type: "null" }],
    },
    title: { anyOf: [{ type: "string", maxLength: 200 }, { type: "null" }] },
    date: { anyOf: [{ type: "string", maxLength: 40 }, { type: "null" }] },
    meetingType: {
      anyOf: [
        { type: "string", enum: ["internal", "client", "technical"] },
        { type: "null" },
      ],
    },
    shortSummary: {
      anyOf: [{ type: "string", maxLength: 2000 }, { type: "null" }],
    },
    conclusion: {
      anyOf: [{ type: "string", maxLength: 2000 }, { type: "null" }],
    },
    people: {
      anyOf: [
        {
          type: "array",
          maxItems: 30,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string", maxLength: 80 },
              nextSteps: {
                type: "array",
                maxItems: 20,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    text: { type: "string", maxLength: 400 },
                    due: {
                      anyOf: [{ type: "string", maxLength: 80 }, { type: "null" }],
                    },
                    sources: {
                      type: "array",
                      maxItems: 8,
                      items: { type: "string", maxLength: 400 },
                    },
                  },
                  required: ["text", "due", "sources"],
                },
              },
            },
            required: ["name", "nextSteps"],
          },
        },
        { type: "null" },
      ],
    },
  },
  required: [
    "ok",
    "error",
    "title",
    "date",
    "meetingType",
    "shortSummary",
    "conclusion",
    "people",
  ],
} as const;

const modelOutputSchema = z
  .object({
    ok: z.boolean(),
    error: z.union([z.literal("not_a_transcript"), z.null()]),
    title: z.string().max(200).nullable(),
    date: z.string().max(40).nullable(),
    meetingType: z
      .enum(["internal", "client", "technical"])
      .nullable(),
    shortSummary: z.string().max(2000).nullable(),
    conclusion: z.string().max(2000).nullable(),
    people: z
      .array(personSchema)
      .max(30)
      .nullable(),
  })
  .transform((value, ctx): z.infer<typeof analyzeResultSchema> => {
    if (!value.ok) {
      if (value.error !== "not_a_transcript") {
        ctx.addIssue({
          code: "custom",
          message: "Not-a-transcript results must use the defined error code.",
        });
        return z.NEVER;
      }
      return { ok: false, error: "not_a_transcript" };
    }

    const parsed = meetingReportSuccessSchema.safeParse({
      ok: true,
      title: value.title,
      date: value.date,
      meetingType: value.meetingType,
      shortSummary: value.shortSummary,
      conclusion: value.conclusion,
      people: value.people ?? [],
    });

    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        message: "Successful reports must include every required field.",
      });
      return z.NEVER;
    }

    return parsed.data;
  });

export function parseModelOutput(value: unknown): AnalyzeResult {
  const parsed = modelOutputSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("MODEL_OUTPUT_INVALID");
  }
  return normalizeAnalyzeResult(parsed.data);
}
