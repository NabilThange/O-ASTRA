"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "@/styles/marqueetext.css";

const MarqueeText = () => {
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const isForwardRef = useRef(true);

  useEffect(() => {
    const startMarqueeAnimation = (direction: "forward" | "reverse" = "forward") => {
      if (animationRef.current) {
        animationRef.current.kill();
      }

      const duration = 10;

      if (direction === "forward") {
        animationRef.current = gsap.to(".marquee-text-marquee", {
          x: "-200%",
          duration: duration,
          repeat: -1,
          ease: "none",
          modifiers: {
            x: gsap.utils.unitize((x: number) => parseFloat(String(x)) % 100),
          },
        });

        gsap.to(".star-rotate", {
          rotation: "+=110",
          duration: 0.5,
          ease: "power2.out",
        });
      } else {
        animationRef.current = gsap.to(".marquee-text-marquee", {
          x: "0%",
          duration: duration,
          repeat: -1,
          ease: "none",
          modifiers: {
            x: gsap.utils.unitize((x: number) => parseFloat(String(x)) % 100),
          },
        });

        gsap.to(".star-rotate", {
          rotation: "-=110",
          duration: 0.5,
          ease: "power2.out",
        });
      }
    };

    startMarqueeAnimation("forward");
    isForwardRef.current = true;

    const handleWheel = (event: WheelEvent) => {
      const newDirection = event.deltaY > 0 ? "forward" : "reverse";
      if (
        (newDirection === "forward" && !isForwardRef.current) ||
        (newDirection === "reverse" && isForwardRef.current)
      ) {
        isForwardRef.current = newDirection === "forward";
        startMarqueeAnimation(newDirection);
      }
    };

    window.addEventListener("wheel", handleWheel);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  const marqueeItems = Array(6)
    .fill(null)
    .map((_, index) => (
      <div key={index} className="marquee-text-marquee">
        <h1>
          Why ARIA™?<span className="star-rotate">*</span>
        </h1>
      </div>
    ));

  return (
    <div className="marquee-text-container" style={{ backgroundColor: '#181717' }}>
      <div className="marquee-text-move">{marqueeItems}</div>
    </div>
  );
};

export default MarqueeText;
