/**
 * Cloudflare Pages Function — reverse-proxy `/api/*` → Render backend.
 *
 * Keeps SPA on same origin so refresh cookies (path `/api/auth`) work without
 * cross-site SameSite=None gymnastics.
 *
 * Env: API_ORIGIN = https://niha0-api.onrender.com  (no trailing slash)
 */

interface Env {
  API_ORIGIN: string;
}

type RequestInitWithDuplex = RequestInit & { duplex?: "half" };

export const onRequest: PagesFunction<Env> = async (context) => {
  const origin = (context.env.API_ORIGIN || "").replace(/\/$/, "");
  if (!origin) {
    return new Response(
      JSON.stringify({
        error: "API_ORIGIN not configured",
        hint: "Set Pages env API_ORIGIN to your Render service URL (e.g. https://niha0-api.onrender.com)",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const incoming = new URL(context.request.url);
  const target = new URL(incoming.pathname + incoming.search, origin);

  const headers = new Headers(context.request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.replace(":", ""));

  const init: RequestInitWithDuplex = {
    method: context.request.method,
    headers,
    redirect: "manual",
  };

  if (context.request.method !== "GET" && context.request.method !== "HEAD") {
    init.body = context.request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target.toString(), init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
};
