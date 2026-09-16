import React from "react";
import Link from "next/link";
import { Wind } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-primary p-4 relative overflow-hidden">
      {/* Ambient glowing orb */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
        <div className="bg-cyan-500/20 blur-[120px] w-96 h-96 rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
            <Wind className="h-8 w-8 text-brand drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <span className="font-bold text-2xl tracking-wide text-text-primary">
              AirHealth Correlate
            </span>
          </Link>
        </div>
        
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-8 border border-slate-800 shadow-2xl shadow-black/50">
          {children}
        </div>
        
        <p className="text-center text-xs text-text-tertiary mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
