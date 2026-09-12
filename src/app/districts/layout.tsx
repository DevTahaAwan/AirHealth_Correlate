import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "District Air Quality | AirHealth Correlate",
  description: "Comprehensive air quality dashboard for Lahore districts",
};

export default function DistrictsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
