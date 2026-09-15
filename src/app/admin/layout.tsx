import React from "react";
import Link from "next/link";
import { Wind, ShieldAlert, Users, LayoutDashboard, Settings } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50 font-inter">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col hidden md:flex relative z-[999]">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <Wind className="h-6 w-6 text-emerald-500" />
            <span className="font-bold tracking-tight text-white">AirHealth Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-md font-medium text-sm">
            <LayoutDashboard className="h-4 w-4" />
            Command Center
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-not-allowed opacity-50">
            <ShieldAlert className="h-4 w-4" />
            Alert Management
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-not-allowed opacity-50">
            <Users className="h-4 w-4" />
            User Insights
          </Link>
          <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md font-medium text-sm transition-colors cursor-not-allowed opacity-50">
            <Settings className="h-4 w-4" />
            System Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Admin Mode</p>
              <p className="text-[10px] text-slate-500">Elevated access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-4 md:hidden justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-emerald-500" />
            <span className="font-bold tracking-tight text-white">Admin</span>
          </Link>
        </header>

        <div className="flex-1 overflow-auto bg-slate-950">
          {children}
        </div>
      </main>
    </div>
  );
}
