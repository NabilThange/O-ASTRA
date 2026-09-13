"use client";

import React, { useEffect } from "react";
import { useLenis } from "@/lib/aria/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AriaLayoutProps {
  children: React.ReactNode;
}

export function AriaLayout({ children }: AriaLayoutProps) {
  useLenis();

  useEffect(() => {
    // Refresh ScrollTrigger after Lenis is initialized
    ScrollTrigger.refresh();
  }, []);

  return (
    <div 
      className="aria-landing" 
      style={{ 
        backgroundColor: '#181717', 
        minHeight: '100vh', 
        width: '100%',
        position: 'relative'
      }}
    >
      {children}
    </div>
  );
}
