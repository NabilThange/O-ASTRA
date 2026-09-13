import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { VoiceAgentProvider } from "@/providers/VoiceAgentProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aria",
  description: "Aria is the container for desktop agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="/aura-bot/rings.js" defer />
        <script src="/aura-bot/emotions.js" defer />
        <script src="/aura-bot/ball.js" defer />
        <script src="/aura-bot/engine.js" defer />
      </head>
      <body className={inter.className}>
        <VoiceAgentProvider>{children}</VoiceAgentProvider>
      </body>
    </html>
  );
}
