"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap/all";
import { welcomeLinesLG, welcomeLinesSM } from "@/constants/welcome";
import Image from "next/image";
import { useState, useEffect } from "react";

const Welcome = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const welcomeLines = isMobile ? welcomeLinesSM : welcomeLinesLG;

  useGSAP(() => {
    const lines = gsap.utils.toArray<HTMLElement>(".clip-text-welcome");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".welcome-section",
        start: "top 75%",
        end: "bottom 75%",
        scrub: true,
      },
    });

    lines.forEach((line) => {
      tl.to(line, {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        stagger: 0.2,
        duration: 1,
      });
    });
  });

  return (
    <div className="welcome-section w-full h-[120vh] text-[#2A2725] md:px-7 px-6" style={{ backgroundColor: '#181717' }}>
      <div className="flex flex-col gap-2 tracking-[-4] leading-2">
        <div className="w-full md:w-[86%] md:text-[64px] text-[34px] welcome-line md:pt-20">
          <div className="w-full welcome-text flex flex-col justify-center items-start">
            {welcomeLines.map((text, index) => (
              <span
                key={index}
                className="relative block text-darkBrown md:tracking-[-0.010em] tracking-[0.015em]"
              >
                {text}
                <span className="clip-text-welcome md:tracking-[-0.010em] tracking-[0.015em]">
                  {text}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex md:flex-row flex-col justify-between items-center md:p-4 md:mt-20 mt-10">
        <div className="flex flex-row justify-center items-center gap-1">
          <Image
            src="/assets/welcome-1.png"
            alt="ARIA interface preview"
            width={224}
            height={300}
            className="md:rounded-[8rem] rounded-[9rem] md:w-56 w-44"
          />
          <Image
            src="/assets/welcome-2.png"
            alt="ARIA live browser session"
            width={224}
            height={300}
            className="md:rounded-[8rem] rounded-[9rem] md:w-56 w-44"
          />
        </div>
        <div className="md:w-1/2 w-full md:mt-0 mt-10">
          <p className="md:text-[2rem] text-[1.4rem] text-[#b1a696] md:leading-[1.1] md:pr-24 font-normal leading-[26px] tracking-[-0.2px]">
            <span>Zero setup. Zero plugins. Just open ARIA, speak your goal, and watch it work.</span><br />
            <span>Your AI companion guides you through every phase — from understanding to completion.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
