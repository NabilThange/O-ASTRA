import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  TaskDaily01Icon,
  Home01Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // After mounting, we can safely show the theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to determine if a link is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  // Get classes for navigation links based on active state
  const getLinkClasses = (path: string) => {
    const baseClasses =
      "flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg";
    const activeClasses =
      "bg-bytebot-bronze-light-a3 text-bytebot-bronze-light-12";
    const inactiveClasses =
      "text-bytebot-bronze-dark-9 hover:bg-bytebot-bronze-light-a1 hover:text-bytebot-bronze-light-12";

    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <header className="bg-background flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-6">
        {/* Logo / Brand Name */}
        <div className="flex items-center">
          <Link
            href="/home"
            className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 hover:opacity-90 transition-opacity"
          >
            Aria
          </Link>
        </div>
        <div className="border-bytebot-bronze-dark-11 h-5 border border-l-[0.5px]"></div>
        <div className="flex items-center gap-2">
          <Link href="/home" className={getLinkClasses("/home")}>
            <HugeiconsIcon icon={Home01Icon} className="h-4 w-4" />
            <span className="text-sm">Home</span>
          </Link>
          <Link href="/tasks" className={getLinkClasses("/tasks")}>
            <HugeiconsIcon icon={TaskDaily01Icon} className="h-4 w-4" />
            <span className="text-sm">Tasks</span>
          </Link>
          <Link href="/desktop" className={getLinkClasses("/desktop")}>
            <HugeiconsIcon icon={ComputerIcon} className="h-4 w-4" />
            <span className="text-sm">Desktop</span>
          </Link>
          <Link href="/" className={getLinkClasses("/")}>
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Landing</span>
          </Link>

        </div>
      </div>
      <div className="flex items-center gap-3"></div>
    </header>
  );
}
