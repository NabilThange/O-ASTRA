"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AuraBotEngine {
  setEmotion: (emotion: string) => AuraBotEngine;
  setGaze: (x: number, y: number) => AuraBotEngine;
  clearGaze: () => AuraBotEngine;
  destroy: () => void;
}

interface EmotionBallRuntime {
  create: (
    target: HTMLElement,
    options: {
      emotion: string;
      shape: "blob";
      idle: boolean;
      label: string;
    }
  ) => AuraBotEngine;
}

declare global {
  interface Window {
    EmotionBall?: EmotionBallRuntime;
    EB_RINGS?: unknown;
  }
}

export interface AuraBotProps {
  isTaskInputFocused?: boolean;
  emotion?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  isInteractive?: boolean;
  className?: string;
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

const isEngineReady = () =>
  typeof window !== "undefined" &&
  Boolean(window.EB_RINGS) &&
  typeof window.EmotionBall?.create === "function";

async function ensureEmotionBallLoaded(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isEngineReady()) return true;

  const scripts = [
    "/aura-bot/rings.js",
    "/aura-bot/emotions.js",
    "/aura-bot/ball.js",
    "/aura-bot/engine.js",
  ];

  for (const src of scripts) {
    if (isEngineReady()) return true;
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (!existing) {
      await new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = (e) => {
          console.error(`[AuraBot] Error loading ${src}`, e);
          resolve();
        };
        document.head.appendChild(s);
      });
    }
  }

  // Poll until engine is ready (in case scripts were in <head> and are deferring/executing)
  const startTime = Date.now();
  while (!isEngineReady() && Date.now() - startTime < 3000) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return isEngineReady();
}

export function AuraBot({
  isTaskInputFocused,
  emotion,
  size = "lg",
  onClick,
  isInteractive = true,
  className,
}: AuraBotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AuraBotEngine | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(() => isEngineReady());

  useEffect(() => {
    let isCancelled = false;

    if (isEngineReady()) {
      setRuntimeReady(true);
    } else {
      ensureEmotionBallLoaded().then((ready) => {
        if (!isCancelled && ready) {
          setRuntimeReady(true);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Initialize engine once runtime is loaded
  useEffect(() => {
    if (!runtimeReady || !containerRef.current || !isEngineReady()) return;

    if (engineRef.current) {
      try {
        engineRef.current.destroy();
      } catch {}
      engineRef.current = null;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const initialEmotion = emotion || (isTaskInputFocused ? "13" : "03");
    try {
      const engine = window.EmotionBall!.create(containerRef.current, {
        emotion: initialEmotion,
        shape: "blob",
        idle: false,
        label: "Aria Aura",
      });
      engineRef.current = engine;
    } catch (err) {
      console.error("[AuraBot] Failed to create engine:", err);
    }

    return () => {
      if (engineRef.current) {
        try {
          engineRef.current.destroy();
        } catch {}
        engineRef.current = null;
      }
    };
  }, [runtimeReady]);

  // Update emotion dynamically
  useEffect(() => {
    if (!engineRef.current) return;
    const targetEmotion =
      emotion || (isTaskInputFocused ? "13" : "03");
    engineRef.current.setEmotion(targetEmotion);
  }, [emotion, isTaskInputFocused]);

  // Gaze tracking
  useEffect(() => {
    if (!runtimeReady || !isInteractive) return;

    let rect: DOMRect | null = null;
    const refreshRect = () => {
      rect = containerRef.current?.getBoundingClientRect() ?? null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!rect || !rect.width || !rect.height) refreshRect();
      if (!rect) return;

      const x = clamp(
        (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
      );
      const y = clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
      );
      engineRef.current?.setGaze(x, y);
    };

    const clearGaze = () => engineRef.current?.clearGaze();

    refreshRect();
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("resize", refreshRect, { passive: true });
    window.addEventListener("scroll", refreshRect, { passive: true });
    document.addEventListener("pointerleave", clearGaze);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("scroll", refreshRect);
      document.removeEventListener("pointerleave", clearGaze);
    };
  }, [runtimeReady, isInteractive]);

  // Dimensions based on size prop
  const sizeClasses = {
    sm: "w-24 h-24 sm:w-28 sm:h-28",
    md: "w-44 h-44 sm:w-56 sm:h-56",
    lg: "w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center transition-transform",
        onClick ? "cursor-pointer hover:scale-105 active:scale-95" : "",
        sizeClasses[size],
        className
      )}
    >
      <div
        ref={containerRef}
        aria-hidden="true"
        className="pointer-events-none h-full w-full"
      />
    </div>
  );
}
