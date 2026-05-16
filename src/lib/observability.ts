export function logError(scope: string, error: unknown, context?: Record<string, unknown>) {
  const payload = {
    level: "error",
    scope,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString()
  };
  console.error(JSON.stringify(payload));
}
