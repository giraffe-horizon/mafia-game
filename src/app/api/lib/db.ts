import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@/db";

export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return (env as { DB: D1Database }).DB;
}
