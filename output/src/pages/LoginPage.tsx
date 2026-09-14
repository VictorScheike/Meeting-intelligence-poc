import { NotebookPen } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  TurnstileField,
  type TurnstileFieldHandle,
} from "@/components/TurnstileField.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { login, RequestError } from "@/lib/api.ts";

type LoginPageProps = {
  onSuccess: () => void;
  onError: (message: string) => void;
  onOpenFeatures?: () => void;
};

const isLocalDev = import.meta.env.DEV;
const LOCAL_DEV_PASSWORD = isLocalDev ? "1234" : "";
const LOCAL_DEV_TURNSTILE_TOKEN = "local-dev";

export function LoginPage({ onSuccess, onError, onOpenFeatures }: LoginPageProps) {
  const [password, setPassword] = useState(LOCAL_DEV_PASSWORD);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const turnstileRef = useRef<TurnstileFieldHandle>(null);

  useEffect(() => {
    if (!isLocalDev) {
      return;
    }
    const input = passwordRef.current;
    if (!input) {
      return;
    }
    input.focus();
    input.select();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const turnstileToken = isLocalDev ? LOCAL_DEV_TURNSTILE_TOKEN : token;
    if (!turnstileToken) {
      onError("Complete the verification check to continue.");
      return;
    }
    setLoading(true);
    try {
      await login(password, turnstileToken);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof RequestError
          ? error.message
          : "Sign-in failed. Please try again.";
      onError(message);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-10">
      <div className="w-full min-w-0 max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <NotebookPen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Meeting Intelligence</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Turn Original meeting notes into clear decisions and personal next steps.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to the demo</CardTitle>
            <CardDescription>
              Use the shared demo password to open the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLocalDev ? "off" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={(event) => {
                    if (isLocalDev) {
                      event.currentTarget.select();
                    }
                  }}
                  required
                />
              </div>
              {isLocalDev ? null : (
                <TurnstileField ref={turnstileRef} onToken={setToken} />
              )}
              <Button
                className="w-full"
                type="submit"
                disabled={loading || (!isLocalDev && token.length === 0)}
              >
                {loading ? "Signing in..." : "Continue"}
              </Button>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Uploaded Original meeting notes are not stored by this application.
            </p>
          </CardContent>
        </Card>
        {onOpenFeatures ? (
          <div className="mt-6 text-center">
            <Button variant="ghost" size="sm" type="button" onClick={onOpenFeatures}>
              How it’s built
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
