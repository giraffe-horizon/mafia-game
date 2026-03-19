export interface ClientConfig {
  appVersion: string;
  enableDevTools: boolean;
  // Add more client-safe settings here as needed
}

/** Reads env vars on the server, result is passed to ClientConfigProvider for client access. */
export async function getClientConfig(): Promise<ClientConfig> {
  return {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
    enableDevTools: process.env.ENABLE_DEV_TOOLS === "true",
  };
}
