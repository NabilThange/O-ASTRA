"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap/all";
import { useState, useEffect } from "react";
import { chooseLinesLG, chooseLinesSM } from "@/constants/welcome";

const Choose = () => {
  const [isMobD, setIsMobD] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width:768px)");
    setIsMobD(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobD(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const chooseLines = isMobD ? chooseLinesSM : chooseLinesLG;

  useGSAP(() => {
    const lines = gsap.utils.toArray<HTMLElement>(".choose-title-clip");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".choose-section",
        start: "top 75%",
        end: "bottom 100%",
        scrub: true,
      },
    });

    tl.from(".choose-subtitle", {
      yPercent: 100,
      opacity: 0,
      ease: "power1.inOut",
    });

    if (!isMobD) {
      tl.fromTo(
        ".title-part",
        { height: "10vh" },
        { height: "50vh", ease: "none" }
      );
    }

    tl.to(
      lines,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        stagger: 0.2,
        duration: 1,
      },
      "<"
    );

    if (!isMobD) {
      tl.from(".choose-sec", { yPercent: 100, duration: 1 }, "<");
    }
  });

  return (
    <section className="choose-section w-full h-dvh p-8 pt-10" style={{ background: 'linear-gradient(to bottom, #181717 0%, #181717 50%, #1f1d1b 65%, #1f1d1b 75%, #1f1d1b 85%, #1f1d1b 90%, #2b2825 100%)' }}>
      <p className="text-[.7rem] text-[#eae5dd] choose-subtitle">
        The ARIA workflow — transparent from start to finish
      </p>
      <div className="lg:mt-10 mt-7 title-part origin-bottom">
        {chooseLines.map((line, index) => (
          <h1
            key={index}
            className="choose-heading text-[#f4efe7] lg:text-[9.5rem] text-[3rem] leading-[0.9] font-medium tracking-tighter choose-title"
          >
            <span className={`choose-title-break ${index === 1 ? "lg:pb-3 pb-2" : ""}`}>
              {line}
              <span className={`choose-title-clip ${index === 1 ? "lg:pb-3 pb-2" : ""}`}>
                {line}
              </span>
            </span>
          </h1>
        ))}
      </div>
      <div className="choose-sec w-full flex lg:flex-row flex-col justify-center items-start gap-10 lg:mt-0">
        <div className="lg:w-1/2 w-full text-[#b1a696] lg:text-[2rem] text-[1rem] md:leading-[1.1] lg:mt-0 mt-8 lg:pr-16">
          <p>
            ARIA doesn&apos;t just execute blindly. It clarifies what you want, shows you exactly how it plans to achieve it, waits for your approval, then runs every action in a live browser while you watch.
          </p>
        </div>
        <div className="lg:w-1/2 w-full">
          <div className="lg:w-[30%] w-[60%]">
            <p className="text-[.7rem] text-[#eae5dd]">
              Built on six core principles:
            </p>
          </div>
          <div className="flex flex-1 flex-wrap justify-start items-start gap-2 mt-8">
            <div className="border-[1px] border-[#b1a696] text-[#b1a696] lg:text-[2rem] px-[20px] py-[4px] rounded-full">Transparent</div>
            <div className="border-[1px] border-[#f4efe7] text-[#f4efe7] lg:text-[2rem] px-[20px] py-[4px] rounded-full">Collaborative</div>
            <div className="border-[1px] border-[#b1a696] text-[#b1a696] lg:text-[2rem] px-[20px] py-[4px] rounded-full">Interruptible</div>
            <div className="border-[1px] border-[#f4efe7] text-[#f4efe7] lg:text-[2rem] px-[20px] py-[4px] rounded-full">Personified</div>
            <div className="border-[1px] border-[#b1a696] text-[#b1a696] lg:text-[2rem] px-[20px] py-[4px] rounded-full">Safe</div>
            <div className="border-[1px] border-[#f4efe7] text-[#f4efe7] lg:text-[2rem] px-[20px] py-[4px] rounded-full">Real-time</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Choose;
