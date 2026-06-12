import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth/AuthProvider";

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
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
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
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
