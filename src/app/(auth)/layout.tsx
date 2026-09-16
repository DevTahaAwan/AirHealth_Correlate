"use client";

import React from "react";
import Link from "next/link";
import { Wind } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#0a0e14] p-4 relative overflow-hidden">
      {/* Atmospheric haze layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-amber-600/[0.08] blur-[100px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] rounded-full bg-orange-500/[0.06] blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] rounded-full bg-slate-500/[0.05] blur-[90px]" />
      </div>

      {/* Drifting particulate texture */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.15]">
        <div className="smog-particles" />
      </div>

      {/* Fine grain overlay for texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-10 animate-fade-up" style={{ animationDelay: "0ms" }}>
          <Link
            href="/"
            className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-sm group"
          >
            <Wind className="h-7 w-7 text-amber-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.4)] transition-transform group-hover:scale-110" />
            <span
              className="text-2xl tracking-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AirHealth <span className="text-amber-400">Correlate</span>
            </span>
          </Link>
        </div>

        <div
          className="relative rounded-2xl p-8 border border-white/[0.08] shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-fade-up"
          style={{
            background:
              "linear-gradient(160deg, rgba(30,27,24,0.85) 0%, rgba(15,17,22,0.9) 100%)",
            backdropFilter: "blur(20px)",
            animationDelay: "80ms",
          }}
        >
          {/* Top edge accent line */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          {children}
        </div>

        <p
          className="text-center text-xs text-slate-500 mt-8 animate-fade-up"
          style={{ animationDelay: "160ms" }}
        >
          By continuing, you agree to our{" "}
          <span className="text-slate-400">Terms of Service</span> and{" "}
          <span className="text-slate-400">Privacy Policy</span>.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes drift {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(-40px, -60px);
          }
        }
        .smog-particles {
          position: absolute;
          inset: -20%;
          background-image: radial-gradient(
              2px 2px at 20% 30%,
              rgba(251, 191, 36, 0.6),
              transparent
            ),
            radial-gradient(2px 2px at 70% 60%, rgba(251, 146, 60, 0.5), transparent),
            radial-gradient(1.5px 1.5px at 40% 80%, rgba(255, 255, 255, 0.4), transparent),
            radial-gradient(1.5px 1.5px at 85% 20%, rgba(251, 191, 36, 0.4), transparent),
            radial-gradient(2px 2px at 55% 45%, rgba(255, 255, 255, 0.3), transparent),
            radial-gradient(1px 1px at 10% 65%, rgba(251, 146, 60, 0.5), transparent);
          background-repeat: repeat;
          background-size: 400px 400px;
          animation: drift 40s linear infinite;
        }
      `}</style>
    </div>
  );
}
