import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createProxyServer } from "http-proxy";
import next from "next";
import { createServer } from "http";
import dotenv from "dotenv";
import { URL } from "url";
import path from "path";
import fs from "fs";

// Load environment variables in the correct order
// 1. Load .env first
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 2. Load .env.local to override (if it exists)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath, override: true });
  console.log('Loaded .env.local');
}

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "9992", 10);

// Backend URLs
const ARIA_AGENT_BASE_URL = process.env.ARIA_AGENT_BASE_URL;
const ARIA_DESKTOP_VNC_URL = process.env.ARIA_DESKTOP_VNC_URL;

console.log("Configuration:");
console.log("  ARIA_AGENT_BASE_URL:", ARIA_AGENT_BASE_URL);
console.log("  ARIA_DESKTOP_VNC_URL:", ARIA_DESKTOP_VNC_URL);

const app = next({ dev, hostname, port });

app
  .prepare()
  .then(() => {
    const handle = app.getRequestHandler();
    const nextUpgradeHandler = app.getUpgradeHandler();

    const vncProxy = createProxyServer({ changeOrigin: true, ws: true });

    const expressApp = express();
    const server = createServer(expressApp);

    // WebSocket proxy for Socket.IO connections to backend
    const tasksProxy = createProxyMiddleware({
      target: ARIA_AGENT_BASE_URL,
      ws: true,
      pathRewrite: { "^/api/proxy/tasks": "/socket.io" },
    });

    // DON'T apply HTTP proxy here - let Next.js API routes handle it
    // expressApp.use("/api/proxy/tasks", tasksProxy);
    
    // VNC WebSocket proxy - handle HTTP requests (though WebSocket is typically upgrade-only)
    expressApp.use("/api/proxy/websockify", (req, res) => {
      console.log("[VNC Proxy] HTTP request to /api/proxy/websockify");
      
      if (!ARIA_DESKTOP_VNC_URL) {
        console.error("[VNC Proxy] ARIA_DESKTOP_VNC_URL not configured");
        return res.status(500).json({ error: "Desktop VNC URL not configured" });
      }

      try {
        // Parse the target URL
        const targetUrl = new URL(ARIA_DESKTOP_VNC_URL);
        
        // Convert ws:// to http:// and wss:// to https:// for HTTP proxy
        const httpProtocol = targetUrl.protocol === "wss:" ? "https:" : "http:";
        const targetHost = `${httpProtocol}//${targetUrl.host}`;
        
        // Preserve the path from the target URL
        const targetPath = targetUrl.pathname + (req.url?.replace(/^\/api\/proxy\/websockify/, "") || "");
        
        console.log("[VNC Proxy] Proxying to:", targetHost, "Path:", targetPath);
        
        vncProxy.web(req, res, {
          target: targetHost,
          changeOrigin: true,
        });
      } catch (error) {
        console.error("[VNC Proxy] Error:", error);
        res.status(500).json({ error: "Proxy configuration error" });
      }
    });

    // Handle all other requests with Next.js
    expressApp.all("*", (req, res) => handle(req, res));

    // Properly upgrade WebSocket connections
    server.on("upgrade", (request, socket, head) => {
      const { pathname } = new URL(
        request.url!,
        `http://${request.headers.host}`,
      );

      console.log("[Upgrade] Request to:", pathname);
      console.log("[Upgrade] Headers:", {
        upgrade: request.headers.upgrade,
        connection: request.headers.connection,
        "sec-websocket-key": request.headers["sec-websocket-key"],
        "sec-websocket-version": request.headers["sec-websocket-version"],
      });

      if (pathname.startsWith("/api/proxy/tasks")) {
        console.log("[Upgrade] Routing to tasks proxy");
        return tasksProxy.upgrade(request, socket as any, head);
      }

      if (pathname.startsWith("/api/proxy/websockify")) {
        console.log("[Upgrade] Routing to VNC proxy");
        
        if (!ARIA_DESKTOP_VNC_URL) {
          console.error("[Upgrade] ARIA_DESKTOP_VNC_URL not configured");
          socket.destroy();
          return;
        }

        try {
          const targetUrl = new URL(ARIA_DESKTOP_VNC_URL);
          
          // Convert ws:// to http:// and wss:// to https:// for http-proxy
          const httpProtocol = targetUrl.protocol === "wss:" ? "https:" : "http:";
          const targetHost = `${httpProtocol}//${targetUrl.host}`;
          
          // Preserve the path from the target URL
          const targetPath = targetUrl.pathname + (request.url?.replace(/^\/api\/proxy\/websockify/, "") || "");
          
          console.log("[Upgrade] Proxying WebSocket to:", targetHost, "Path:", targetPath);
          console.log("[Upgrade] Target URL:", `${targetHost}${targetPath}`);
          
          // Modify the request URL to match the target path
          request.url = targetPath;
          
          // Add error handling for the socket
          socket.on("error", (err) => {
            console.error("[Upgrade] Socket error:", err);
          });
          
          return vncProxy.ws(request, socket as any, head, {
            target: targetHost,
            changeOrigin: true,
          });
        } catch (error) {
          console.error("[Upgrade] Error:", error);
          socket.destroy();
          return;
        }
      }

      nextUpgradeHandler(request, socket, head);
    });

    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Server failed to start:", err);
    process.exit(1);
  });
