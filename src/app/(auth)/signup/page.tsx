"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Loader2, AlertCircle, Mail, Lock } from "lucide-react";

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
      <h1 className="text-2xl mb-2 text-center bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-extrabold">
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

      <form onSubmit={handleSignup} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-slate-400 h-5 w-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-text-primary"
              placeholder="you@example.com"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-slate-400 h-5 w-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all text-text-primary"
              placeholder="••••••••"
            />
          </div>
          <p className="text-xs text-text-tertiary mt-1">Must be at least 6 characters long.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !email || password.length < 6}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-orange-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all mt-6"
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
