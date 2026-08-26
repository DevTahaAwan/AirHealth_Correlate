import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        countdown: [
          "56px",
          { lineHeight: "1.0", letterSpacing: "-0.03em", fontWeight: "800" },
        ],
        display: [
          "40px",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
      },
      colors: {
        "bg-primary": "var(--bg-primary)",
        "bg-secondary": "var(--bg-secondary)",
        "bg-tertiary": "var(--bg-tertiary)",

        brand: {
          DEFAULT: "var(--brand)",
          hover: "var(--brand-hover)",
          active: "var(--brand-active)",
          subtle: "var(--brand-subtle)",
        },

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        "text-placeholder": "var(--text-tertiary)",
        "text-disabled": "var(--text-tertiary)",

        "border-default": "var(--border-default)",
        "border-subtle": "var(--border-subtle)",

        risk: {
          low: "var(--risk-low)",
          moderate: "var(--risk-moderate)",
          high: "var(--risk-high)",
          "very-high": "var(--risk-very-high)",
        },

        "risk-bg": {
          low: "var(--risk-low)",
          moderate: "var(--risk-moderate)",
          high: "var(--risk-high)",
          "very-high": "var(--risk-very-high)",
        },

        community: {
          DEFAULT: "var(--community)",
          subtle: "var(--community-subtle)",
          text: "var(--community-text)",
          border: "var(--community)",
        },

        surge: {
          DEFAULT: "var(--surge)",
          subtle: "var(--surge-subtle)",
          text: "var(--surge-text)",
          title: "var(--surge-text)",
        },

        success: {
          DEFAULT: "var(--risk-low)",
          subtle: "rgba(34, 197, 94, 0.1)",
          text: "var(--risk-low)",
        },
        warning: {
          DEFAULT: "var(--risk-moderate)",
          subtle: "rgba(234, 179, 8, 0.1)",
          text: "var(--risk-moderate)",
        },
        error: {
          DEFAULT: "var(--risk-very-high)",
          subtle: "rgba(239, 68, 68, 0.1)",
          text: "var(--risk-very-high)",
        },
        info: {
          DEFAULT: "var(--brand)",
          subtle: "var(--brand-subtle)",
          text: "var(--brand)",
        },
      },
      spacing: {
        "nav-height": "64px",
        sidebar: "320px",
      },
      maxWidth: {
        content: "1280px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0px 1px 2px 0px rgba(15,23,42,0.06)",
        elevated: "0px 4px 12px 0px rgba(15,23,42,0.10)",
        surge: "0px 4px 16px 0px rgba(219,39,119,0.25)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
      transitionTimingFunction: {
        "ease-default": "cubic-bezier(0.4,0,0.2,1)",
        "ease-enter": "cubic-bezier(0,0,0.2,1)",
        "ease-exit": "cubic-bezier(0.4,0,1,1)",
        "ease-spring": "cubic-bezier(0.34,1.56,0.64,1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "surge-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.96)" },
        },
      },
      animation: {
        shimmer: "shimmer 1500ms linear infinite",
        "surge-pulse": "surge-pulse 3s ease-in-out infinite",
        "slide-up": "slide-up 320ms cubic-bezier(0,0,0.2,1)",
        "slide-down": "slide-down 320ms cubic-bezier(0.4,0,1,1)",
        "slide-in-right": "slide-in-right 320ms cubic-bezier(0,0,0.2,1)",
        "fade-in": "fade-in 320ms cubic-bezier(0,0,0.2,1)",
        "fade-out": "fade-out 320ms cubic-bezier(0.4,0,1,1)",
      },
    },
  },
  plugins: [],
};

export default config;
