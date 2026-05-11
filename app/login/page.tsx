import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="product-canvas flex min-h-screen items-center justify-center px-6 py-16">
      <div className="surface-card w-full max-w-[420px] border-border/70 p-9 sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Studio LMS</p>
        <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Sign in with your instructor or student credentials.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
