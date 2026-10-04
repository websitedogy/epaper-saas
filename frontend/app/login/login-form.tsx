"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { API_BASE_URL, API_TOKEN_KEY } from "@/lib/api";

type LoginFormProps = {
  host: string;
  central: boolean;
};

export function LoginForm({ host, central }: LoginFormProps) {
  const router = useRouter();
  const destination = central ? "/super-admin" : "/tenant-admin";
  const [email, setEmail] = useState(central ? "superadmin@example.com" : "");
  const [password, setPassword] = useState(central ? "Password123!" : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    router.prefetch("/super-admin");
    router.prefetch("/tenant-admin");
    if (window.localStorage.getItem(API_TOKEN_KEY)) {
      window.location.replace(destination);
    }
  }, [destination, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Host": host,
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload?.message ?? "Login failed");
        setLoading(false);
        return;
      }

      const token = payload?.data?.token;
      if (!token) {
        setError("Authentication token was not returned by the API.");
        setLoading(false);
        return;
      }

      window.localStorage.setItem(API_TOKEN_KEY, token);
      const roles: string[] = payload?.data?.user?.roles ?? [];
      window.location.replace(roles.includes("customer-admin") ? "/tenant-admin" : "/super-admin");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong while logging in.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#eff6ff_0%,_#f8fafc_36%,_#eef2ff_100%)] px-4 py-10">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
        <div className="grid md:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-slate-950 p-8 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                Dogy ePaper SaaS
              </div>
              <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight">
                {central ? "Super Admin Portal" : `${host} Tenant Portal`}
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                {central
                  ? "Manage direct clients, domains, and keep publishing operations running at scale."
                  : "Upload editions, manage categories, and publish a branded digital newspaper for this title."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Secure access</p>
              <p className="mt-2 text-2xl font-semibold text-white">Protected by Laravel Sanctum</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8 text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                {central ? "Dogy Super Admin Login" : `${host} Tenant Login`}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">Sign in to your account</h2>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                  placeholder={central ? "superadmin@example.com" : "tenant@abcnews.localhost"}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
                  placeholder="Password123!"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-sky-700 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
