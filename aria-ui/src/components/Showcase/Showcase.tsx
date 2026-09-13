"use client";
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const Showcase = () => {
  const containerRef = useRef<HTMLElement>(null);
  const imgConRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!imgConRef.current || !containerRef.current) return;

    const totalWidth =
      imgConRef.current.scrollWidth - containerRef.current.offsetWidth;

    gsap.to(imgConRef.current, {
      x: () => -totalWidth,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "-10% 10%",
        end: () => `+=${totalWidth}`,
        scrub: true,
        pin: true,
      },
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full h-dvh overflow-hidden" style={{ backgroundColor: '#181717' }}>
      <div
        ref={imgConRef}
        className="absolute top-0 left-0 h-full flex items-center justify-start gap-2 p-2 overflow-hidden"
      >
        {/* Scenario 1 */}
        <div className="relative flex-shrink-0 w-[80vw] h-full overflow-hidden">
          <div className="w-[77vw] absolute top-10 left-5 flex justify-between items-start text-[#f4efe7]">
            <h1 className="text-3xl font-bold">Research task<br />happy path</h1>
            <p className="border-[1px] rounded-3xl px-2 py-1 text-center text-[0.7rem]">Scenario 01</p>
          </div>
          <img src="/aria-assets/activities-1.png" alt="Research scenario" className="image-item w-full h-full object-cover rounded-[2.5rem]" loading="eager" />
          <div className="w-[77vw] absolute bottom-10 left-5 flex justify-between items-start">
            <p className="text-[0.68rem] font-bold text-[#f4efe7]">
              Goal is clear. No questions. ARIA builds the plan,<br />user approves, execution runs live to completion.
            </p>
            <div className="flex justify-center items-center">
              <p className="text-[#f4efe7] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">01</p>
              <p className="text-[#4e484e] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
            </div>
          </div>
        </div>

        {/* Scenario 2 */}
        <div className="relative flex-shrink-0 w-[80vw] h-full overflow-hidden">
          <div className="w-[77vw] absolute top-10 left-5 flex justify-between items-start text-[#f4efe7]">
            <h1 className="text-3xl font-bold">User edits<br />the plan</h1>
            <p className="border-[1px] rounded-3xl px-2 py-1 text-center text-[0.7rem]">Scenario 02</p>
          </div>
          <img src="/aria-assets/activities-2.png" alt="Plan editing scenario" className="image-item w-full h-full object-cover rounded-[2.5rem]" loading="lazy" />
          <div className="w-[77vw] absolute bottom-10 left-5 flex justify-between items-start">
            <p className="text-[0.68rem] font-bold text-[#f4efe7]">
              User deletes a step, adds a new one, reorders them.<br />ARIA executes the user&apos;s version exactly. No deviation.
            </p>
            <div className="flex justify-center items-center">
              <p className="text-[#f4efe7] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">02</p>
              <p className="text-[#4e484e] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
            </div>
          </div>
        </div>

        {/* Scenario 3 */}
        <div className="relative flex-shrink-0 w-[80vw] h-full overflow-hidden">
          <div className="w-[77vw] absolute top-10 left-5 flex justify-between items-start text-[#f4efe7]">
            <h1 className="text-3xl font-bold">STOP, edit,<br />resume mid-plan</h1>
            <p className="border-[1px] rounded-3xl px-2 py-1 text-center text-[0.7rem]">Scenario 03</p>
          </div>
          <img src="/aria-assets/activities-3.png" alt="Stop and resume scenario" className="image-item w-full h-full object-cover rounded-[2.5rem]" loading="lazy" />
          <div className="w-[77vw] absolute bottom-10 left-5 flex justify-between items-start">
            <p className="text-[0.68rem] font-bold text-[#f4efe7]">
              User hits STOP mid-execution. Edits Step 3.<br />Resumes from that exact step — no restart needed.
            </p>
            <div className="flex justify-center items-center">
              <p className="text-[#f4efe7] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
              <p className="text-[#4e484e] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Showcase;
