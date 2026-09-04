"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type AuraEmotion = "03" | "13";

interface AuraBotEngine {
  setEmotion: (emotion: AuraEmotion) => AuraBotEngine;
  setGaze: (x: number, y: number) => AuraBotEngine;
  clearGaze: () => AuraBotEngine;
  destroy: () => void;
}

interface EmotionBallRuntime {
  create: (
    target: HTMLElement,
    options: {
      emotion: AuraEmotion;
      shape: "blob";
      idle: false;
      label: string;
    },
  ) => AuraBotEngine;
}

declare global {
  interface Window {
    EmotionBall?: EmotionBallRuntime;
  }
}

interface AuraBotProps {
  isTaskInputFocused: boolean;
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export function AuraBot({ isTaskInputFocused }: AuraBotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AuraBotEngine | null>(null);
  const [runtimeReady, setRuntimeReady] = useState(false);

  useEffect(() => {
    if (!runtimeReady || !containerRef.current || !window.EmotionBall) return;

    const engine = window.EmotionBall.create(containerRef.current, {
      emotion: "03",
      shape: "blob",
      idle: false,
      label: "Aura Bot",
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [runtimeReady]);

  useEffect(() => {
    engineRef.current?.setEmotion(isTaskInputFocused ? "13" : "03");
  }, [isTaskInputFocused]);

  useEffect(() => {
    if (!runtimeReady) return;

    let rect: DOMRect | null = null;
    const refreshRect = () => {
      rect = containerRef.current?.getBoundingClientRect() ?? null;
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!rect || !rect.width || !rect.height) refreshRect();
      if (!rect) return;

      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2));
      const y = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2));
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
  }, [runtimeReady]);

  return (
    <>
      <Script src="/aura-bot/rings.js" strategy="afterInteractive" />
      <Script src="/aura-bot/emotions.js" strategy="afterInteractive" />
      <Script src="/aura-bot/ball.js" strategy="afterInteractive" />
      <Script
        src="/aura-bot/engine.js"
        strategy="afterInteractive"
        onLoad={() => setRuntimeReady(true)}
      />
      <div
        ref={containerRef}
        aria-hidden="true"
        className="pointer-events-none h-full w-full"
      />
    </>
  );
}
