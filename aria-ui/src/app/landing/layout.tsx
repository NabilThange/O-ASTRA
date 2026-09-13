"use client";

import { useEffect } from "react";
import "./landing.css";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Force dark background - this overrides globals.css
    document.documentElement.style.backgroundColor = '#181717';
    document.body.style.backgroundColor = '#181717';
    
    return () => {
      // Reset to light on unmount
      document.documentElement.style.backgroundColor = '#f5f5f5';
      document.body.style.backgroundColor = '#f5f5f5';
    };
  }, []);

  return (
    <div className="landing-layout-root" style={{ 
      backgroundColor: '#181717', 
      minHeight: '100vh', 
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {children}
    </div>
  );
}
