"use client";

import { createContext, useContext } from "react";
import type { ClientConfig } from "./client";

const ConfigContext = createContext<ClientConfig | null>(null);

export function ClientConfigProvider({
  config,
  children,
}: {
  config: ClientConfig;
  children: React.ReactNode;
}) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useClientConfig(): ClientConfig {
  const config = useContext(ConfigContext);
  if (!config) throw new Error("useClientConfig must be used within ClientConfigProvider");
  return config;
}
