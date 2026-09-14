"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Loader2, AlertCircle } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || "/";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        }
      });

      if (signUpError) throw signUpError;
      
      // Auto sign-in happens typically if email confirm is disabled, otherwise we'd show a message to check email.
      // Assuming auto-login here since the user specified email confirmation is disabled.
      router.push("/onboarding");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2 text-center">
        Create Account
      </h1>
      <p className="text-text-secondary text-sm text-center mb-6">
        Sign up to start receiving personalized air quality alerts.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-error-subtle border border-error/20 rounded-md flex items-start gap-2 text-error text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow text-text-primary"
            placeholder="you@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 bg-bg-primary border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow text-text-primary"
            placeholder="••••••••"
          />
          <p className="text-xs text-text-tertiary mt-1">Must be at least 6 characters long.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !email || password.length < 6}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-semibold text-brand hover:text-brand-hover transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-6 w-6 text-brand" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
