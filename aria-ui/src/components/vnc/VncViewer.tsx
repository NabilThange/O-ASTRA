"use client";

import React, { useRef, useEffect, useState } from "react";
import { logger } from "@/lib/logger";

interface VncViewerProps {
  viewOnly?: boolean;
  mode?: "online" | "offline";
}

export function VncViewer({ viewOnly = true, mode = "online" }: VncViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<unknown>(null);
  const [VncComponent, setVncComponent] = useState<React.ComponentType<unknown> | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  // Dynamically import VncScreen component
  useEffect(() => {
    import("react-vnc").then(({ VncScreen }) => {
      setVncComponent(() => VncScreen);
      setIsConnecting(false);
    });
  }, []);

  // Setup WebSocket URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const desktopVncUrl = process.env.NEXT_PUBLIC_DESKTOP_VNC_URL!;
    logger.debug({ event: 'vnc.setup', mode, url: desktopVncUrl }, 'Setting up VNC WebSocket connection');
    setConnectionStatus("Connecting...");
    setError(null);
    setWsUrl(desktopVncUrl);
  }, [mode]);

  const handleConnect = () => {
    logger.info({ event: 'vnc.connected' }, 'VNC connected successfully');
    setConnectionStatus("Connected");
    setError(null);
  };

  const handleDisconnect = () => {
    logger.warn({ event: 'vnc.disconnected' }, 'VNC disconnected');
    setConnectionStatus("Disconnected");
  };

  const handleError = (error: unknown) => {
    logger.error({ event: 'vnc.error' }, 'VNC connection error', error instanceof Error ? error : undefined);
    setConnectionStatus("Connection failed");
    setError(error instanceof Error ? error.message : "Unknown error");
  };

  const handleRfbInit = (rfb: unknown) => {
    logger.debug({ event: 'vnc.rfb_init' }, 'VNC RFB initialized');
    rfbRef.current = rfb;

    // Guard against state changes on disconnected RFB
    if (rfb) {
      rfb.addEventListener("connect", handleConnect);
      rfb.addEventListener("disconnect", handleDisconnect);
      rfb.addEventListener("error", handleError);
    }
  };

  // Cleanup on unmount - guard against disconnected RFB
  useEffect(() => {
    return () => {
      if (rfbRef.current) {
        try {
          const rfb = rfbRef.current as { _rfbConnectionState?: string; disconnect?: () => void };
          if (rfb._rfbConnectionState === "connected" && rfb.disconnect) {
            logger.debug({ event: 'vnc.cleanup' }, 'Disconnecting RFB on unmount');
            rfb.disconnect();
          }
        } catch {
          logger.debug({ event: 'vnc.cleanup_skipped' }, 'RFB already disconnected during cleanup');
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-gray-900 flex flex-col items-center justify-center"
    >
      {isConnecting && (
        <div className="text-white text-sm">Loading VNC viewer...</div>
      )}
      {!isConnecting && !wsUrl && (
        <div className="text-white text-sm">Configuring connection...</div>
      )}
      {error && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded text-sm max-w-xs">
          Error: {error}
        </div>
      )}
      {connectionStatus && (
        <div className="absolute top-4 right-4 text-white text-xs bg-gray-800 px-3 py-1 rounded">
          {connectionStatus}
        </div>
      )}
      {VncComponent && wsUrl && (
        <VncComponent
          rfbOptions={{
            secure: false,
            shared: true,
            wsProtocols: ["binary"],
            credentials: {
              username: "",
              password: "",
            },
          }}
          onRfbInit={handleRfbInit}
          autoConnect={true}
          reconnectDelay={3000}
          key={`${viewOnly ? "view-only" : "interactive"}-${mode}-${wsUrl}`}
          url={wsUrl}
          scaleViewport
          viewOnly={viewOnly}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
