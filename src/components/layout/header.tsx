"use client";

import React from "react";
import Link from "next/link";
import { Wind, Menu, Sun, Moon, Settings2 } from "lucide-react";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative flex items-center justify-center h-9 w-9 rounded-md text-text-secondary hover:bg-bg-tertiary transition-colors"
      aria-label="Toggle Theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-bg-secondary/80 backdrop-blur-md border-b border-border-default h-nav-height flex items-center px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 md:hidden text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-md"
          aria-label="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-sm">
          <Wind className="h-6 w-6 text-brand" />
          <span className="font-bold text-lg hidden sm:inline-block tracking-tight text-text-primary">
            AirHealth Correlate
          </span>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-6 mx-6">
        <Link
          href="/"
          className="text-sm font-medium text-text-secondary hover:text-brand transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/methodology"
          className="text-sm font-medium text-text-secondary hover:text-brand transition-colors"
        >
          Methodology
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {/* Health Profile — always visible, no auth required */}
        <Link
          href="/profile"
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-brand hover:bg-bg-tertiary transition-colors"
          aria-label="Health Profile"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Health Profile</span>
        </Link>
      </div>
    </header>
  );
}
