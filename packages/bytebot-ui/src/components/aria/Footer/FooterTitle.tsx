"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@/styles/footertitle.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(SplitText, ScrollTrigger);
}

const FooterTitle = () => {
  const ftConRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ftConRef.current) return;

      const h1El = ftConRef.current.querySelector<HTMLElement>(".footer-title h1");
      if (!h1El) return;

      const originalHTML = h1El.innerHTML;

      const split = new SplitText(h1El, {
        type: "chars",
        charsClass: "ftChar",
      });

      split.chars.forEach((char) => {
        const el = char as HTMLElement;
        el.innerHTML = `<span>${el.innerHTML}</span>`;
      });

      const innerChars = split.chars
        .map((c) => (c as HTMLElement).querySelector<HTMLElement>("span"))
        .filter((s): s is HTMLElement => s !== null);

      const sub = ftConRef.current.querySelector<HTMLElement>(".footer-title sub");
      if (sub) {
        sub.innerHTML = `<span>${sub.innerHTML}</span>`;
        const subSpan = sub.querySelector<HTMLElement>("span");
        if (subSpan) innerChars.push(subSpan);
      }

      gsap.set(innerChars, { x: "-120%" });

      gsap.to(innerChars, {
        x: "0%",
        stagger: 0.03,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ftConRef.current,
          start: "top 90%",
          end: "top 40%",
          scrub: 1,
        },
      });

      return () => {
        split.revert();
        if (h1El) h1El.innerHTML = originalHTML;
      };
    },
    { scope: ftConRef }
  );

  return (
    <section ref={ftConRef} className="footer-title-section">
      <div className="w-full flex flex-col sm:flex-row justify-between items-center px-6 pt-8 pb-4 gap-2">
        <p className="text-[#b1a696] text-[0.75rem]">
          Built by—<span className="text-[#f2ede5]">the ARIA team</span>
        </p>
        <p className="text-[#b1a696] text-[0.75rem]">
          Powered by <span className="text-[#f2ede5]">advanced AI</span>
        </p>
        <p className="text-[#b1a696] text-[0.75rem]">
          All rights reserved © <span className="text-[#f2ede5]">2026</span>
        </p>
      </div>

      <div className="footer-title w-full text-center my-auto">
        <h1 className="text-[18vw] font-bold">
          ARIA<sub>™</sub>
        </h1>
      </div>
    </section>
  );
};

export default FooterTitle;
