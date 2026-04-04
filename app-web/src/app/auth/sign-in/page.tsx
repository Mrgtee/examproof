"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function SignInPageContent() {
  const searchParams = useSearchParams();

  const rawRedirectedFrom = searchParams.get("redirectedFrom");

  const redirectedFrom =
    rawRedirectedFrom &&
    rawRedirectedFrom.startsWith("/") &&
    !rawRedirectedFrom.includes("/undefined") &&
    !rawRedirectedFrom.includes("/null")
      ? rawRedirectedFrom
      : "/recruiter/create-exam";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        window.location.href = redirectedFrom;
      }
    }

    checkSession();
  }, [redirectedFrom]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage(
        "Sign-in succeeded but no session was created. Disable email confirmation in Supabase and try again."
      );
      setLoading(false);
      return;
    }

    setLoading(false);
    window.location.href = redirectedFrom;
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      window.location.href = redirectedFrom;
      return;
    }

    setMessage(
      "Account created. If email confirmation is enabled in Supabase, disable it or confirm the email before signing in."
    );
    setMode("signin");
  }

  return (
    <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
      <div className="mx-auto max-w-xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
        <div className="text-xs uppercase tracking-[0.28em] text-[#7f6a5a]">
          {mode === "signin" ? "Sign in" : "Create account"}
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Recruiter access
        </h1>
        <p className="mt-3 text-[15px] leading-7 text-[#7f6a5a]">
          {mode === "signin"
            ? "Sign in with your email and password."
            : "Create your recruiter account to access protected workspace areas."}
        </p>

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="mt-8 space-y-4">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
              required
            />
            <div className="flex flex-wrap gap-3">
              <button
                disabled={loading}
                className="rounded-full bg-[#4a3124] px-6 py-3 text-white disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setMessage("");
                }}
                className="rounded-full border border-[#e7dcd1] px-6 py-3"
              >
                Create account
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="mt-8 space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
            />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-[20px] border border-[#e7dcd1] bg-white px-4 py-3 outline-none"
              required
            />
            <div className="flex flex-wrap gap-3">
              <button
                disabled={loading}
                className="rounded-full bg-[#4a3124] px-6 py-3 text-white disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create account"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setMessage("");
                }}
                className="rounded-full border border-[#e7dcd1] px-6 py-3"
              >
                Back to sign in
              </button>
            </div>
          </form>
        )}

        {message && (
          <div className="mt-4 rounded-[20px] border border-[#e7dcd1] bg-[#fffaf4] p-4 text-sm text-[#7f6a5a]">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#ddd1c4] px-4 py-8 text-[#2f241d] md:px-6">
          <div className="mx-auto max-w-xl rounded-[32px] border border-[#e7dcd1] bg-[#f7f2ec] p-6 shadow-[0_24px_90px_rgba(68,45,28,0.10)] md:p-8">
            <div className="text-sm text-[#7f6a5a]">Loading sign in...</div>
          </div>
        </main>
      }
    >
      <SignInPageContent />
    </Suspense>
  );
}