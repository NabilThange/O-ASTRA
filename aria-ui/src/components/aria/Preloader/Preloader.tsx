"use client";

import { useEffect, useState } from "react";
import gsap from "gsap";
import "./preloader.css";

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Safety check for SSR
    if (typeof window === 'undefined') return;
    
    // Prevent scrolling during preloader
    document.body.style.overflow = "hidden";

    // Fallback timeout in case animation fails
    const fallbackTimeout = setTimeout(() => {
      console.warn('Preloader timeout reached, completing');
      setIsComplete(true);
      document.body.style.overflow = "";
      onComplete?.();
    }, 8000); // 8 seconds max

    // Check if elements exist
    const progressBar = document.querySelector('.preloader-progress-bar');
    const progress = document.querySelector('.preloader-progress');
    const mask = document.querySelector('.preloader-mask');
    
    if (!progressBar || !progress || !mask) {
      console.error('Preloader elements not found, completing immediately');
      clearTimeout(fallbackTimeout);
      setIsComplete(true);
      document.body.style.overflow = "";
      onComplete?.();
      return;
    }

    const tl = gsap.timeline({
      delay: 0.3,
      onComplete: () => {
        clearTimeout(fallbackTimeout);
        setIsComplete(true);
        document.body.style.overflow = "";
        // Call the callback after a small delay to ensure DOM is ready
        setTimeout(() => {
          onComplete?.();
        }, 100);
      },
    });

    // Animate progress bar
    tl.to(".preloader-progress-bar", {
      scaleX: 1,
      duration: 3,
      ease: "power3.out",
    })
      // Fade out progress
      .to(
        ".preloader-progress",
        {
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
        },
        "+=0.2"
      )
      // Scale up mask
      .to(
        ".preloader-mask",
        {
          scale: 6,
          duration: 2.5,
          ease: "power3.out",
        },
        "<"
      )
      // Fade out mask
      .to(
        ".preloader-mask",
        {
          opacity: 0,
          duration: 0.5,
        },
        "+=0.5"
      );

    return () => {
      clearTimeout(fallbackTimeout);
      tl.kill();
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  if (isComplete) return null;

  return (
    <div className="preloader-wrapper">
      <div className="preloader-progress">
        <div className="preloader-progress-bar"></div>
        <div className="preloader-logo">
          <h1 suppressHydrationWarning dangerouslySetInnerHTML={{ __html: 'Aria' }} />
        </div>
      </div>

      <div className="preloader-mask"></div>

      <div className="preloader-content">
        <div className="preloader-footer">
          <p className="text-sm">
            Meet ARIA®—an AI computer use agent
            <br />
            powered by multi-agent intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}
