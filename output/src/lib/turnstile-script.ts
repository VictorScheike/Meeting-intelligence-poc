type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  size?: "normal" | "flexible" | "compact";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

export type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onMeetingIntelligenceTurnstileLoad?: () => void;
  }
}

export const TURNSTILE_ONLOAD_CALLBACK = "onMeetingIntelligenceTurnstileLoad";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<void> | undefined;

export function isTurnstileApiReady(): boolean {
  return typeof window.turnstile?.render === "function";
}

export function loadTurnstileScript(): Promise<void> {
  if (isTurnstileApiReady()) {
    return Promise.resolve();
  }
  if (loading) {
    return loading;
  }

  loading = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (!isTurnstileApiReady()) {
        reject(new Error("Turnstile failed to load."));
        return;
      }
      resolve();
    };

    window.onMeetingIntelligenceTurnstileLoad = finish;

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-turnstile-script]",
    );
    if (existing) {
      if (isTurnstileApiReady()) {
        finish();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile failed to load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `${SCRIPT_SRC}&onload=${TURNSTILE_ONLOAD_CALLBACK}`;
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";
    script.onerror = () => reject(new Error("Turnstile failed to load."));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });

  return loading;
}
