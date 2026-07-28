"use client";

import { AlertCircle, ArrowRight, Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { elapsedMs, logPerf, nowMs } from "@/lib/perf";

const demoAccounts = [
  { role: "Administrator", email: "admin@tdtutdtu.edu.vn" },
  { role: "Lecturer", email: "lecturer01@tdtutdtu.edu.vn" },
  { role: "Student", email: "522h0001@tdtutdtu.edu.vn" },
] as const;

const demoPassword = "123123123Az!";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    const flowStartedAt = nowMs();
    event.preventDefault();
    setError("");

    try {
      const loginStartedAt = nowMs();
      await login(email, password);
      logPerf(`login-submit-to-auth-complete=${elapsedMs(loginStartedAt)}ms`);
      const normalizedEmail = email.toLowerCase();
      logPerf(`complete-login-before-redirect=${elapsedMs(flowStartedAt)}ms`);
      if (normalizedEmail.includes("lecturer")) router.push("/lecturer");
      else if (normalizedEmail.includes("admin")) router.push("/admin");
      else router.push("/student");
    } catch (loginError: any) {
      const message = String(loginError?.message || "").toLowerCase();
      setError(
        message.includes("failed to fetch")
          ? "Unable to connect to the server. Check that the backend is running on port 3001."
          : "Incorrect email or password. Please check and try again.",
      );
    }
  };

  const applyDemoAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="page-surface min-h-[100dvh]">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </span>
            ExamTrust
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" className="container grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,0.55fr)] lg:py-16">
        <section className="hidden max-w-xl lg:block">
          <p className="text-sm font-semibold text-primary">A secure workspace</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.12] tracking-[-0.05em] xl:text-5xl">
            Continue with the workspace for your role
          </h1>
          <p className="mt-5 max-w-[54ch] text-base leading-7 text-muted-foreground">
            Students focus on exams. Lecturers manage assessments. Administrators oversee operations and academic integrity.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3" aria-label="Supported roles">
            {demoAccounts.map((account) => (
              <div key={account.role} className="rounded-xl border border-border/70 bg-card/80 px-4 py-5 shadow-soft">
                <p className="text-sm font-semibold">{account.role}</p>
                <p className="mt-1 text-xs text-muted-foreground">Dedicated workspace</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-medium sm:p-8">
            <div>
              <p className="text-sm font-semibold text-primary">Welcome back</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Sign in to ExamTrust</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the account issued by your institution.</p>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-6" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="email@tdtu.edu.vn"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/reset-password" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="pr-11"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs leading-5 text-muted-foreground">
                By signing in, you agree to your institution's usage and data-protection policies.
              </p>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Signing in
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-card/70 p-4">
            <p className="text-sm font-semibold">Demo accounts</p>
            <p className="mt-1 text-xs text-muted-foreground">Select a role to fill in the sign-in details.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {demoAccounts.map((account) => (
                <Button
                  key={account.email}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-11 whitespace-normal px-2 py-2 text-xs"
                  onClick={() => applyDemoAccount(account.email)}
                >
                  {account.role}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
