import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth-context";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "highlight.js/styles/github-dark.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "MVP Builder AI",
  description: "Your AI software architect assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${headingFont.variable} ${monoFont.variable}`}
    >
      <body className="bg-background text-foreground dark antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
