"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import "./marqueetext.css";

const MarqueeText = () => {
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const isForwardRef = useRef(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timeoutId = setTimeout(() => {
      const startMarqueeAnimation = (direction = "forward") => {
        if (animationRef.current) {
          animationRef.current.kill();
        }

        const duration = 12;

        if (direction === "forward") {
          animationRef.current = gsap.to(".marquee-text-marquee", {
            x: "-100%",
            duration: duration,
            repeat: -1,
            ease: "none",
            modifiers: {
              x: gsap.utils.unitize((x) => parseFloat(x) % 100),
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
              x: gsap.utils.unitize((x) => parseFloat(x) % 100),
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
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const marqueeItems = Array(6)
    .fill(null)
    .map((_, index) => (
      <div key={index} className="marquee-text-marquee">
        <h1>
          Why Aria®?<span className="star-rotate">*</span>
        </h1>
      </div>
    ));

  return (
    <div
      className="marquee-text-container"
      style={{ backgroundColor: "#181717" }}
    >
      <div className="marquee-text-move">{marqueeItems}</div>
    </div>
  );
};

export default MarqueeText;
