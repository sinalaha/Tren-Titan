/**
 * При SSR клиент tRPC может зафиксировать абсолютный URL с чужим origin (другой порт / NEXT_PUBLIC_APP_URL).
 * В браузере тогда уходит запрос не на тот dev-сервер и в ответ приходит HTML → «Unexpected token '<'…».
 */
export function trpcBrowserFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window === "undefined") {
    return fetch(input, init);
  }
  if (typeof input !== "string") {
    return fetch(input, init);
  }
  try {
    const u = new URL(input, window.location.href);
    if (!u.pathname.startsWith("/api/trpc")) {
      return fetch(input, init);
    }
    const nextUrl = `${window.location.origin}${u.pathname}${u.search}`;
    return fetch(nextUrl, init);
  } catch {
    return fetch(input, init);
  }
}
