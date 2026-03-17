"use client";

import packageJson from "../../package.json";

export function AppVersion() {
  return (
    <span className="text-slate-700 text-[10px] font-typewriter tracking-widest">
      v{packageJson.version}
    </span>
  );
}
