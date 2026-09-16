"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Loader2, AlertCircle, Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { supabase } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl mb-2 text-center bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-extrabold">
        Welcome Back
      </h1>
      <p className="text-text-secondary text-sm text-center mb-6">
        Sign in to access your personalized AirHealth profile.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-error-subtle border border-error/20 rounded-md flex items-start gap-2 text-error text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
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
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-text-primary"
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
              className="w-full pl-10 pr-4 py-2 bg-bg-primary border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-text-primary"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all mt-6"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="font-semibold text-brand hover:text-brand-hover transition-colors">
          Create one
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-6 w-6 text-brand" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
