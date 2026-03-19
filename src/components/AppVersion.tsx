"use client";

import packageJson from "../../package.json";

export function AppVersion() {
  return (
    <span className="text-on-surface/20 text-[10px] font-display tracking-widest">
      v{packageJson.version}
    </span>
  );
}
