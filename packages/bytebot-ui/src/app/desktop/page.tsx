"use client";

import React from "react";
import { Header } from "@/components/layout/Header";
import { DesktopContainer } from "@/components/ui/desktop-container";

export default function DesktopPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />

      <main className="flex-1 overflow-hidden p-2 sm:p-4">
        <div className="flex h-full w-full items-center justify-center">
          <DesktopContainer viewOnly={false} status="live_view" className="shadow-sm rounded-xl border border-neutral-200" />
        </div>
      </main>
    </div>
  );
}
