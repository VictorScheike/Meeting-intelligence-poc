import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TURNSTILE_ONLOAD_CALLBACK,
  loadTurnstileScript,
} from "./turnstile-script.ts";

type ScriptStub = {
  src: string;
  async: boolean;
  defer: boolean;
  dataset: Record<string, string>;
  onerror: ((error?: unknown) => void) | null;
  addEventListener: (type: string, listener: () => void) => void;
};

function stubDom(existing?: ScriptStub) {
  const created: ScriptStub[] = [];
  const windowStub: {
    turnstile?: { render: () => string; reset: () => void; remove: () => void };
    onMeetingIntelligenceTurnstileLoad?: () => void;
  } = {};

  vi.stubGlobal("window", windowStub);
  vi.stubGlobal("document", {
    querySelector: () => existing ?? null,
    createElement: () => {
      const script: ScriptStub = {
        src: "",
        async: false,
        defer: false,
        dataset: {},
        onerror: null,
        addEventListener: vi.fn(),
      };
      created.push(script);
      return script;
    },
    head: {
      appendChild: vi.fn((node: ScriptStub) => node),
    },
  });

  return { created, windowStub };
}

describe("loadTurnstileScript", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("loads api.js with an onload callback and never calls turnstile.ready()", async () => {
    const { created, windowStub } = stubDom();
    const pending = loadTurnstileScript();

    expect(created).toHaveLength(1);
    expect(created[0]?.src).toContain("render=explicit");
    expect(created[0]?.src).toContain(`onload=${TURNSTILE_ONLOAD_CALLBACK}`);

    windowStub.turnstile = {
      render: () => "widget",
      reset: () => undefined,
      remove: () => undefined,
    };
    windowStub.onMeetingIntelligenceTurnstileLoad?.();

    await expect(pending).resolves.toBeUndefined();
  });

  it("resolves immediately when render is already available", async () => {
    const { created, windowStub } = stubDom();
    windowStub.turnstile = {
      render: () => "widget",
      reset: () => undefined,
      remove: () => undefined,
    };

    await expect(loadTurnstileScript()).resolves.toBeUndefined();
    expect(created).toHaveLength(0);
  });
});
