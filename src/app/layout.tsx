import type { Metadata } from "next";
import "./globals.css";
import packageJson from "../../package.json";
import { Be_Vietnam_Pro, Special_Elite } from "next/font/google";
import { getClientConfig, ClientConfigProvider } from "@/config";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-be-vietnam-pro",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-special-elite",
});

export const metadata: Metadata = {
  title: `Mafia Game v${packageJson.version}`,
  description: "Pomocnik do gry Mafia",
  other: {
    "app-version": packageJson.version,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const clientConfig = await getClientConfig();

  return (
    <html lang="pl" className={`dark ${beVietnamPro.variable} ${specialElite.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display min-h-screen flex flex-col items-center justify-center m-0 p-0 antialiased overflow-x-hidden selection:bg-primary/30">
        <ClientConfigProvider config={clientConfig}>{children}</ClientConfigProvider>
      </body>
    </html>
  );
}
