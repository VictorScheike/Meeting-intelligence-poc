import { NotebookPen } from "lucide-react";
import { useState, type FormEvent } from "react";
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
};

export function LoginPage({ onSuccess, onError }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(password);
      onSuccess();
    } catch (error) {
      const message =
        error instanceof RequestError
          ? error.message
          : "Sign-in failed. Please try again.";
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <NotebookPen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-3xl tracking-tight">Meeting Intelligence</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Turn transcripts into clear decisions and personal next steps.
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
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Continue"}
              </Button>
            </form>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              The OpenAI key stays server-side and uploaded transcripts are not stored
              by this application.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
