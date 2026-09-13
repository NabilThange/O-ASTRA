"use client";

import { useEffect } from "react";

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Set light background for desktop
    document.documentElement.style.backgroundColor = '#f5f5f5';
    document.body.style.backgroundColor = '#f5f5f5';
    
    return () => {
      // Reset on unmount
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    };
  }, []);

  return <>{children}</>;
}
