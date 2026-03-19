export function getErrorMessage(error: unknown, fallback = "Błąd połączenia"): string {
  return error instanceof Error ? error.message : fallback;
}
