import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface GameLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/** Globalny gradient teczki — widoczny na WSZYSTKICH ekranach */
const DOSSIER_GRADIENT =
  "linear-gradient(160deg, #5E8F6D 0%, #8BA87A 15%, #B5B478 30%, #CBBC7A 45%, #D4B06E 55%, #D49E68 70%, #D48E5C 85%, #D08558 100%)";

export default function GameLayout({ children, className, ...props }: GameLayoutProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-stretch",
        "max-w-lg mx-auto w-full min-h-screen",
        "text-on-surface",
        "overflow-hidden grain",
        className
      )}
      style={{ background: DOSSIER_GRADIENT }}
      {...props}
    >
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Ciemny overlay — gradient prześwituje ~12% */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{ backgroundColor: "rgba(19, 19, 19, 0.88)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

export { default as PageLayout } from "@/components/ui/GameLayout";
