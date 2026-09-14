import React from "react";
import Link from "next/link";
import { Wind } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-primary p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
            <Wind className="h-8 w-8 text-brand" />
            <span className="font-bold text-2xl tracking-tight text-text-primary">
              AirHealth Correlate
            </span>
          </Link>
        </div>
        
        <div className="bg-bg-secondary rounded-2xl shadow-elevated p-8 border border-border-default">
          {children}
        </div>
        
        <p className="text-center text-xs text-text-tertiary mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
