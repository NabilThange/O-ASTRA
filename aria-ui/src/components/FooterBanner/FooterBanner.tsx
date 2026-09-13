"use client";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ClickIndicator from "../MapLink/ClickIndicator";
import Image from "next/image";

const FooterBanner = () => {
  const [active, setActive] = useState(false);
  const fbConRef = useRef<HTMLDivElement>(null);
  const fbImgRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!fbConRef.current || !fbImgRef.current) return;

    gsap.fromTo(
      fbImgRef.current,
      { scale: 1.2 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: fbConRef.current,
          start: "top bottom-=20%",
          end: "bottom top+=20%",
          scrub: true,
        },
      }
    );
  }, { scope: fbConRef });

  return (
    <div ref={fbConRef} className="w-screen h-dvh p-2 overflow-hidden" style={{ backgroundColor: '#181717' }}>
      <div className="w-full relative overflow-hidden rounded-4xl h-full">
        <ClickIndicator active={active} />
        <div
          ref={fbImgRef}
          className="w-full h-full"
          onMouseEnter={() => setActive(true)}
          onMouseLeave={() => setActive(false)}
        >
          <Image
            src="/assets/background3.png"
            alt="ARIA banner"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>

        <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10vw] font-bold text-[#f4efe7]">
          ARIA<sub className="text-[5vw]">™</sub>
        </h1>
        <div className="absolute bottom-5 px-4 w-full">
          <div className="w-full h-auto flex md:flex-row flex-col md:justify-between md:items-end">
            <h2
              className="text-start lg:mt-0 md:text-[#f4efe7] text-[#b1a696] text-2xl font-bold md:tracking-wider leading-5 flex flex-col gap-1"
              style={{ textShadow: "2px 2px 4px #000" }}
            >
              <span>Tell it what</span>
              <span>you want—Watch</span>
              <span>it happen.</span>
            </h2>

            <p
              className="md:w-[20%] w-[80%] text-[#f4efe7] text-[0.7rem] font-bold md:font-medium tracking-wide lg:text-end mt-2 text-justify"
              style={{ textShadow: "2px 2px 4px #000" }}
            >
              ARIA — the AI browser agent that plans, executes, and verifies — live and in full view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterBanner;
