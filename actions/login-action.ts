"use server";

import { CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

/** `ok: true` → client must `window.location` navigate so Set-Cookie from this action is applied before the next document load (Vercel + Server Actions + `redirect()` can drop the session). */
export type LoginActionState = { error?: string } | { ok: true };

function authRedirectUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    return new URL(url, "http://localhost:3000");
  }
}

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  let resultUrl: string;
  try {
    resultUrl = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof CredentialsSignin) {
      return { error: "Invalid email or password." };
    }
    throw e;
  }

  const loc = authRedirectUrl(resultUrl);
  const err = loc.searchParams.get("error");
  if (err) {
    return { error: "Invalid email or password." };
  }

  return { ok: true };
}
