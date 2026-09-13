"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import "./preloaderII.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText);
}

export default function Preloader() {
  useGSAP(() => {
    function createSplitTexts(
      elements: { key: string; selector: string; type: string }[]
    ) {
      const splits: Record<string, ReturnType<typeof SplitText.create>> = {};
      elements.forEach(({ key, selector, type }) => {
        const config: Parameters<typeof SplitText.create>[1] = {
          type: type as "chars" | "lines",
          mask: type as "chars" | "lines",
        };
        if (type === "chars") {
          (config as Record<string, unknown>).charsClass = "char";
        }
        if (type === "lines") {
          (config as Record<string, unknown>).linesClass = "line";
        }
        splits[key] = SplitText.create(selector, config);
      });
      return splits;
    }

    const splitElements = [
      { key: "logoChars", selector: ".preloader-logo h1", type: "chars" },
      { key: "footerLines", selector: ".preloader-footer p", type: "lines" },
    ];

    const splits = createSplitTexts(splitElements);

    if (splits.logoChars?.chars) {
      gsap.set(splits.logoChars.chars, { x: "100%" });
    }
    if (splits.footerLines?.lines) {
      gsap.set(splits.footerLines.lines, { y: "100%" });
    }

    function animateProgress(duration = 2.8) {
      const tl = gsap.timeline();
      const counterSteps = 3;
      let currentProgress = 0;

      for (let i = 0; i < counterSteps; i++) {
        const finalStep = i === counterSteps - 1;
        const targetProgress = finalStep
          ? 1
          : Math.min(currentProgress + Math.random() * 0.35 + 0.15, 0.85);
        currentProgress = targetProgress;

        tl.to(".preloader-progress-bar", {
          scaleX: targetProgress,
          duration: duration / counterSteps,
          ease: "power2.inOut",
        });
      }

      return tl;
    }

    const tl = gsap.timeline({ delay: 0.2 });

    if (splits.logoChars?.chars) {
      tl.to(splits.logoChars.chars, {
        x: "0%",
        stagger: 0.05,
        duration: 0.8,
        ease: "power4.inOut",
      });
    }

    if (splits.footerLines?.lines) {
      tl.to(
        splits.footerLines.lines,
        {
          y: "0%",
          stagger: 0.1,
          duration: 0.8,
          ease: "power4.inOut",
        },
        "0.2"
      );
    }

    tl.add(animateProgress(), "<");

    if (splits.logoChars?.chars) {
      tl.to(
        splits.logoChars.chars,
        {
          x: "-100%",
          stagger: 0.05,
          duration: 0.8,
          ease: "power4.inOut",
        },
        "+=0.1"
      );
    }

    if (splits.footerLines?.lines) {
      tl.to(
        splits.footerLines.lines,
        {
          y: "-100%",
          stagger: 0.1,
          duration: 0.5,
          ease: "power4.inOut",
        },
        "-=0.2"
      );
    }

    // 1. Fade out the progress bar layer so the mask cutout is exposed to the page
    tl.to(".preloader-progress", {
      opacity: 0,
      duration: 0.6,
      ease: "power3.out",
    })
      // 2. Expand the mask capsule opening outward into full viewport
      .to(
        ".preloader-mask",
        {
          scale: 8,
          duration: 2.2,
          ease: "power3.inOut",
        },
        "-=0.2"
      )
      .to(
        ".preloader-mask",
        {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.5"
      )
      .set(".preloader-container-root", { display: "none" });
  }, []);

  return (
    <div className="preloader-container-root size-full fixed inset-0 z-50 overflow-hidden pointer-events-none">
      <div className="preloader-progress">
        <div className="preloader-progress-bar"></div>
        <div className="preloader-logo">
          <h1>ARIA™</h1>
        </div>
      </div>

      <div className="preloader-mask"></div>

      <div className="preloader-content">
        <div className="preloader-footer">
          <p className="text-sm">
            ARIA — Autonomous Real-time<br />
            Intelligence Agent. Intelligent automation.
          </p>
        </div>
      </div>
    </div>
  );
}
