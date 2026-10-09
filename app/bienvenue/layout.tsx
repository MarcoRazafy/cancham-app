import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bienvenue · CanCham Connect" };

export default function BienvenueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marque min-h-screen flex flex-col">{children}</div>;
}
