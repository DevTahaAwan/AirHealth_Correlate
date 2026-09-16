import type { Metadata } from "next";
import "./globals.css";
import { Fraunces } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastProvider } from "@/lib/hooks/use-toast";
import { ToastContainer } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "AirHealth Correlate",
  description: "Real-time respiratory health correlation with AQI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased font-inter bg-bg-primary text-text-primary ${fraunces.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              {children}
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
