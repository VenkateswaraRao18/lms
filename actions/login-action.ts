"use server";

import { redirect } from "next/navigation";
import { CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";

export type LoginActionState = { error?: string };

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

  redirect("/");
}
