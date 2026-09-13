import { NextRequest } from "next/server";

/**
 * WebSocket proxy for VNC connection
 * Proxies WebSocket connections from the browser to the desktop daemon
 */
export async function GET(req: NextRequest) {
  const desktopVncUrl = process.env.ARIA_DESKTOP_VNC_URL!;
  
  console.log("[WebSocket Proxy] Incoming WebSocket upgrade request");
  console.log("[WebSocket Proxy] Target URL:", desktopVncUrl);

  // Check if this is a WebSocket upgrade request
  const upgrade = req.headers.get("upgrade");
  if (upgrade !== "websocket") {
    console.error("[WebSocket Proxy] Not a WebSocket upgrade request");
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  try {
    // In Next.js App Router, we need to use the underlying Node.js server
    // This is handled by the server itself, not the route handler
    // We return a 101 Switching Protocols response
    
    // Note: Next.js doesn't directly support WebSocket upgrades in route handlers
    // The actual WebSocket proxying needs to be handled at the server level
    // For development, we'll return instructions
    
    return new Response(
      JSON.stringify({
        error: "WebSocket proxy not configured",
        message: "WebSocket connections must be proxied at the server level",
        instructions: "Use a reverse proxy (nginx, caddy) or configure Next.js custom server",
        targetUrl: desktopVncUrl,
      }),
      {
        status: 501,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("[WebSocket Proxy] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
