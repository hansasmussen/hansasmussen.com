"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      className="login-form"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        if (!email || !password) {
          setStatus("Enter both email and password.");
          return;
        }

        setIsSubmitting(true);
        setStatus("Signing in...");

        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            throw error;
          }

          setStatus("Signed in. Redirecting...");
          router.push(next);
          router.refresh();
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Login failed.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <div className="admin-copy-actions">
        <button className="admin-save" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </div>
      <p className="login-status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
