import type { Metadata } from "next";
import "./globals.css";
import packageJson from "../../package.json";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: `Mafia Game v${packageJson.version}`,
  description: "Pomocnik do gry Mafia",
  other: {
    "app-version": packageJson.version,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`dark ${spaceGrotesk.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface font-display min-h-screen flex flex-col items-center justify-center m-0 p-0 antialiased overflow-x-hidden selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
