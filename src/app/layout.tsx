import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ANSUT Cockpit DG - Tableau de Bord de Direction Générale",
  description:
    "Cockpit de Direction Générale ANSUT — Tableau de bord exécutif pour le pilotage stratégique, le suivi financier, la gouvernance et la gestion des risques.",
  keywords: [
    "ANSUT",
    "Cockpit DG",
    "Direction Générale",
    "Tableau de Bord",
    "Gouvernance",
    "Finance",
    "Ressources Humaines",
    "Risques",
  ],
  authors: [{ name: "ANSUT" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ANSUT Cockpit DG",
    description:
      "Tableau de bord exécutif pour le pilotage stratégique ANSUT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
