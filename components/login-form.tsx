"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginActionState } from "@/actions/login-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = {} as LoginActionState;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-2 h-11 w-full text-[15px] shadow-md shadow-primary/10" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      window.location.assign("/");
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {state && "error" in state && state.error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 border-border/80 bg-background/90 text-[15px] shadow-sm"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 border-border/80 bg-background/90 text-[15px] shadow-sm"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
