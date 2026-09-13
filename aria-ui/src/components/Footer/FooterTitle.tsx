"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import "@/styles/footertitle.css";

gsap.registerPlugin(SplitText, ScrollTrigger);

const FooterTitle = () => {
  const ftConRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!ftConRef.current) return;

    const h1El = ftConRef.current.querySelector<HTMLElement>(".footer-title h1");
    if (!h1El) return;

    const originalHTML = h1El.innerHTML;

    const split = new SplitText(".footer-title h1", {
      type: "chars",
      charsClass: "ftChar",
    });

    split.chars.forEach((char) => {
      (char as HTMLElement).innerHTML = `<span>${(char as HTMLElement).innerHTML}</span>`;
    });

    const innerChars = split.chars.map((c) =>
      (c as HTMLElement).querySelector<HTMLElement>("span")
    ).filter((s): s is HTMLElement => s !== null);

    const sub = ftConRef.current.querySelector<HTMLElement>(".footer-title sub");
    if (sub) {
      sub.innerHTML = `<span>${sub.innerHTML}</span>`;
      const subSpan = sub.querySelector<HTMLElement>("span");
      if (subSpan) innerChars.push(subSpan);
    }

    gsap.set(innerChars, { x: "-120%" });

    gsap.to(innerChars, {
      x: "0%",
      stagger: 0.02,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ftConRef.current,
        start: "top 90%",
        end: "top 80%",
        scrub: true,
      },
    });

    return () => {
      split.revert();
      if (h1El) h1El.innerHTML = originalHTML;
    };
  }, { scope: ftConRef });

  return (
    <section ref={ftConRef} className="relative z-1 w-screen h-[40vh] border-t border-t-[#c4c1b9]">
      <div className="w-full flex justify-between items-center px-6 mt-8">
        <p className="text-[#b1a696] text-[0.7rem]">
          Built by—<a href="#" className="text-[#f2ede5]">the ARIA team</a>
        </p>
        <p className="text-[#b1a696] text-[0.7rem]">
          Powered by <a href="#" className="text-[#f2ede5]">advanced AI</a>
        </p>
        <p className="text-[#b1a696] text-[0.7rem]">
          All rights reserved © <a href="#" className="text-[#f2ede5]">2026</a>
        </p>
      </div>

      <div className="footer-title w-full text-center">
        <h1 className="text-[18vw] font-bold">
          ARIA<sub>™</sub>
        </h1>
      </div>
    </section>
  );
};

export default FooterTitle;
