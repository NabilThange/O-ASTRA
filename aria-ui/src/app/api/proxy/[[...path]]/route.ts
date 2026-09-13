import { NextRequest } from "next/server";

/* -------------------------------------------------------------------- */
/* Proxy for backend API requests                                       */
/* -------------------------------------------------------------------- */
async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const BASE_URL = process.env.ARIA_AGENT_BASE_URL!;
  const subPath = path.length ? path.join("/") : "";
  const url = `${BASE_URL}/${subPath}${req.nextUrl.search}`;

  // Forward all headers except hop-by-hop headers
  const forwardHeaders = new Headers();
  const hopByHopHeaders = new Set([
    'connection', 'keep-alive', 'transfer-encoding', 
    'te', 'trailer', 'proxy-authorization', 'proxy-authenticate', 'upgrade'
  ]);

  req.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders,
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.text(),
  };

  try {
    console.log(`[Proxy] Forwarding ${req.method} ${url}`);
    
    // Don't forward cache-related headers to avoid 304 responses
    // The proxy should always get fresh data from backend
    forwardHeaders.delete('if-none-match');
    forwardHeaders.delete('if-modified-since');
    
    // IMPORTANT: Don't forward accept-encoding to prevent compression issues
    // Let the backend send uncompressed data, Vercel will compress it
    forwardHeaders.delete('accept-encoding');
    
    const res = await fetch(url, init);
    const body = await res.text();
    
    console.log(`[Proxy] Backend responded: ${res.status} ${res.statusText}, Content-Type: ${res.headers.get('content-type')}, Body length: ${body.length}`);

    // Forward all response headers except hop-by-hop headers and compression headers
    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!hopByHopHeaders.has(lowerKey) && 
          lowerKey !== 'content-encoding' && 
          lowerKey !== 'content-length') {
        responseHeaders.set(key, value);
      }
    });

    // Ensure Set-Cookie headers are preserved (they may be multiple)
    const setCookieHeaders = res.headers.getSetCookie?.() || [];
    setCookieHeaders.forEach((cookie) => {
      responseHeaders.append("Set-Cookie", cookie);
    });

    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[Proxy] Error for ${url}:`, error);
    
    // Distinguish between network errors and other errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isNetworkError = errorMessage.includes("fetch failed") || 
                          errorMessage.includes("ECONNREFUSED") ||
                          errorMessage.includes("ETIMEDOUT");
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to proxy request",
        details: errorMessage,
        type: isNetworkError ? "network_error" : "proxy_error",
        backendUrl: url
      }),
      {
        status: isNetworkError ? 503 : 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/* -------------------------------------------------------------------- */
/* Route handlers                                                       */
/* -------------------------------------------------------------------- */
type PathParams = Promise<{ path?: string[] }>;

async function handler(req: NextRequest, { params }: { params: PathParams }) {
  const { path } = await params;
  return proxy(req, path ?? []);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
