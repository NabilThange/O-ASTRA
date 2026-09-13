"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { DesktopContainer } from "@/components/ui/desktop-container";
import { Button } from "@/components/ui/button";
import { Cloud, Monitor, Info } from "lucide-react";

export default function DesktopPage() {
  const [mode, setMode] = useState<"online" | "offline">("offline"); // Default to offline for local testing
  const [showInfo, setShowInfo] = useState(false);

  // Load saved preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("desktopMode") as "online" | "offline" | null;
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  const toggleMode = (newMode: "online" | "offline") => {
    setMode(newMode);
    localStorage.setItem("desktopMode", newMode);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bytebot-bronze-light-1">
      <Header />

      <main className="m-2 flex-1 overflow-hidden bg-bytebot-bronze-light-1 px-2 py-4">
        <div className="flex h-full flex-col gap-4">
          {/* Mode Toggle Section */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
              <Button
                variant={mode === "online" ? "default" : "ghost"}
                size="sm"
                onClick={() => toggleMode("online")}
                className="flex items-center gap-2"
              >
                <Cloud className="h-4 w-4" />
                Online Desktop
              </Button>
              <Button
                variant={mode === "offline" ? "default" : "ghost"}
                size="sm"
                onClick={() => toggleMode("offline")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Local Desktop
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Info
            </Button>
          </div>

          {/* Info Panel */}
          {showInfo && (
            <div className="mx-auto w-[60%] rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
              <h3 className="mb-2 font-semibold text-blue-900">Desktop Mode Information</h3>
              <div className="space-y-2 text-blue-800">
                <div>
                  <strong>Online Desktop:</strong> Connects to hosted desktop environment (when available).
                  No local setup required.
                </div>
                <div>
                  <strong>Local Desktop:</strong> Connects to your locally running desktop daemon.
                  <div className="mt-1 ml-4 text-xs">
                    • Requires ariad running on localhost:9990<br />
                    • Run: <code className="bg-blue-100 px-1 rounded">docker-compose up ariad</code><br />
                    • Or: <code className="bg-blue-100 px-1 rounded">npm run desktop</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Container */}
          <div className="flex flex-1 items-center justify-center">
            <div className="w-[60%]">
              <DesktopContainer 
                viewOnly={false} 
                status="live_view"
                mode={mode}
              >
                {/* No action buttons for desktop page */}
              </DesktopContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
