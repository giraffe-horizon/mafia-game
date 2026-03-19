/**
 * Server-side configuration — reads from environment variables at runtime.
 * WARNING: Do NOT import this module in client components ("use client").
 * Use `getClientConfig()` from `@/config/client` for browser-safe config.
 */

export interface ServerConfig {
  enableDevTools: boolean;
  // Add more server-only settings here as needed
}

export async function getServerConfig(): Promise<ServerConfig> {
  return {
    enableDevTools: process.env.ENABLE_DEV_TOOLS === "true",
  };
}
