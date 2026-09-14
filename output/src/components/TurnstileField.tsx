import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { loadTurnstileScript } from "@/lib/turnstile-script.ts";
import { TURNSTILE_LOGIN_ACTION, TURNSTILE_SITEKEY } from "@/lib/turnstile.ts";

export type TurnstileFieldHandle = {
  reset: () => void;
};

type TurnstileFieldProps = {
  onToken: (token: string) => void;
};

export const TurnstileField = forwardRef<TurnstileFieldHandle, TurnstileFieldProps>(
  function TurnstileField({ onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);

    useEffect(() => {
      onTokenRef.current = onToken;
    }, [onToken]);

    useImperativeHandle(ref, () => ({
      reset() {
        const widgetId = widgetIdRef.current;
        if (widgetId && window.turnstile) {
          window.turnstile.reset(widgetId);
        }
        onTokenRef.current("");
      },
    }));

    useEffect(() => {
      let cancelled = false;
      let widgetId: string | undefined;

      void loadTurnstileScript()
        .then(() => {
          const container = containerRef.current;
          if (cancelled || !container || typeof window.turnstile?.render !== "function") {
            return;
          }
          widgetId = window.turnstile.render(container, {
            sitekey: TURNSTILE_SITEKEY,
            action: TURNSTILE_LOGIN_ACTION,
            theme: "auto",
            size: "flexible",
            callback: (token) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(""),
            "error-callback": () => onTokenRef.current(""),
          });
          widgetIdRef.current = widgetId;
        })
        .catch(() => {
          if (!cancelled) {
            onTokenRef.current("");
          }
        });

      return () => {
        cancelled = true;
        if (widgetId && window.turnstile) {
          window.turnstile.remove(widgetId);
        }
        widgetIdRef.current = null;
      };
    }, []);

    return (
      <div
        ref={containerRef}
        className="flex min-h-16 w-full max-w-full justify-center overflow-x-auto"
        aria-label="Bot verification"
      />
    );
  },
);
