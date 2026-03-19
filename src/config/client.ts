export interface ClientConfig {
  appVersion: string;
  // Add more client-safe settings here as needed
}

/** Reads from NEXT_PUBLIC_* env vars — safe for both server and client components. */
export function getClientConfig(): ClientConfig {
  return {
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "dev",
  };
}
