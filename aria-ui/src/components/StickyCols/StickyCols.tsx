"use client";
import gsap, { ScrollTrigger, SplitText } from "gsap/all";
import { useGSAP } from "@gsap/react";
import { useState } from "react";
import Image from "next/image";

const StickyCols = () => {
  const [reveal, setReveal] = useState(false);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const textElements = document.querySelectorAll<HTMLElement>(".col-3 h1, .col-3 p");
    textElements.forEach((element) => {
      const split = new SplitText(element, { type: "lines", linesClass: "line" });
      split.lines.forEach((line) => {
        (line as HTMLElement).innerHTML = `<span>${line.textContent}</span>`;
      });
    });

    ScrollTrigger.refresh();

    gsap.set(".col-3 .col-content-wrapper .line span", { yPercent: 0 });
    gsap.set(".col-3 .col-content-wrapper-2 .line span", { yPercent: -125 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".sticky-cols",
        start: "top 20%",
        end: "+=90%",
        pin: true,
        scrub: 1,
      },
    });

    tl.add(() => setReveal(false));

    tl.to(".col-1", { opacity: 0, scale: 0.8, duration: 0.8 })
      .to(".col-2", { x: "0%", duration: 0.8 }, "<")
      .to(".col-3", { y: "0%", duration: 0.8 }, "<")
      .to(".col-img-1 img", { scale: 1, duration: 0.8 }, "<")
      .to(".col-img-2", {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 0.8,
      }, "<")
      .to(".col-img-2 img", { scale: 1.6, duration: 0.8 }, "<");

    tl.add(() => setReveal(false));
    tl.add(() => setReveal(true));

    tl.to(".col-2", { opacity: 0, scale: 0.8, duration: 0.8 })
      .to(".col-3 .col-content-wrapper .line span", { yPercent: -125, duration: 0.8 }, "<");
    tl.to(".col-3", { x: "0%", duration: 0.8 }, "-=0.8")
      .to(".col-4", { y: "0%", duration: 0.8 }, "<")
      .to(".col-3 .col-content-wrapper-2 .line span", { yPercent: 0, delay: 0.4, duration: 0.8 }, "<");

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      tl.kill();
    };
  });

  return (
    <section className="sticky-cols w-screen h-dvh overflow-hidden bg-[#181717] lg:mb-20">
      <div className="sticky-cols-wrapper relative w-full h-screen">
        <div className="col col-1">
          <div className="col-content">
            <div className="col-content-wrapper">
              <h1 className="text-2xl text-[#b1a696] font-bold leading-auto">
                Watch ARIA work<br />live in a real<br />browser — every<br />step visible
              </h1>
              <div className="col-content-para flex items-center gap-4 justify-between">
                <div className="flex items-center gap-0 justify-center">
                  <h3 className="border-1 px-3 py-1 rounded-full text-[#aaa091]">1</h3>
                  <h3 className="border-1 px-3 py-1 rounded-full text-[#524e4b]">3</h3>
                </div>
                <p className={`text-[12px] font-medium ${!reveal ? "mr-6" : "mr-0"}`}>
                  ARIA executes in a sandboxed Chrome browser<br />
                  streamed live — not your personal browser.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="col col-2">
          <div className="col-img col-img-1">
            <div className="col-img-wrapper">
              <Image src="/assets/cap1-square.jpg" alt="ARIA live view" fill style={{ objectFit: "cover" }} />
            </div>
          </div>
          <div className="col col-img-2 p-2">
            <div className="col-img-wrapper">
              <Image src="/assets/cap2-square.jpg" alt="ARIA plan approval" fill style={{ objectFit: "cover" }} />
            </div>
          </div>
        </div>
        <div className="col col-3">
          <div className="col-content-wrapper">
            <h1 className="text-2xl font-bold leading-auto">
              Approve the plan<br />before a single<br />browser action<br />runs
            </h1>
            <div className={`col-content-para flex items-center gap-4 justify-between ${reveal ? "ml-0" : "ml-6"}`}>
              <div className="flex items-center gap-0 justify-center">
                <h3 className="border-1 px-3 py-1 rounded-full text-[#aaa091]">{reveal ? "3" : "2"}</h3>
                <h3 className="border-1 px-3 py-1 rounded-full text-[#524e4b]">3</h3>
              </div>
              <p className="text-[12px] font-medium">
                Edit steps, reorder them, or delete them.<br />
                Full control before execution begins.
              </p>
            </div>
          </div>
          <div className="col-content-wrapper-2">
            <h1 className="text-2xl font-bold leading-auto">
              STOP at any moment<br />and resume<br />from exactly<br />where you left off
            </h1>
            <div className="col-content-para flex items-center gap-4 justify-between">
              <div className="flex items-center gap-0 justify-center"></div>
              <p className={`text-[12px] font-medium ${!reveal ? "mr-0" : "mr-6"}`}>
                Hit STOP — the loop aborts instantly.<br />
                Edit any step. Resume mid-plan. No restart.
              </p>
            </div>
          </div>
        </div>
        <div className="col col-4">
          <div className="col-img col-img-1">
            <div className="col-img-wrapper">
              <Image src="/assets/cap3-square.jpg" alt="ARIA stop and resume" fill style={{ objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StickyCols;
