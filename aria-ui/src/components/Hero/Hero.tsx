"use client";
import gsap from "gsap/all";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

const Hero = () => {
  useGSAP(() => {
    const isMobHero = window.matchMedia("(max-width:768px)").matches;
    if (!isMobHero) {
      gsap.to(".hero-section .hero-img", {
        yPercent: -5,
        stagger: 0.02,
        scale: 1.2,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    }
  }, []);

  return (
    <section className="hero-section w-full md:h-dvh h-[100vh] md:p-2 p-2.5 mb-20" style={{ backgroundColor: '#181717' }}>
      <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden">
        <div className="responsive-mobile">
          {/* Background image (down layer) */}
          <div className="hero-img absolute inset-0 bg-[url('/aria-assets/cap1.png')] bg-no-repeat bg-cover bg-center z-0 md:block hidden" />

          {/* Mobile image fallback */}
          <div className="block lg:hidden mt-6 mb-6">
            <Image
              src="/aria-assets/hero-mobile.png"
              alt="ARIA agent interface"
              width={800}
              height={600}
              priority
              className="w-full rounded-[2rem] object-cover shadow-[0_-25px_45px_-10px_rgba(255,0,0,0.15)]"
            />
          </div>

          {/* Smoke video (upper layer) */}
          <video
            src="/aria-assets/smoke_final.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 md:w-full md:h-full object-cover z-10 pointer-events-none object-center opacity-50 mix-blend-hard-light md:top-0 top-[5%] h-[90%] rounded-[2rem] md:px-0"
          ></video>
        </div>
        <div className="p-4 flex flex-col md:justify-center">
          <div className="relative h-dvh">
            <h1
              className="text-[#f4efe7] text-start text-6xl md:text-9xl font-bold tracking-wider lg:absolute lg:left-2"
              style={{ textShadow: "2px 2px 4px #aaa" }}
            >
              ARIA™
            </h1>

            <div className="w-full h-auto absolute top-24 md:bottom-[8%] lg:bottom-[9%] flex md:flex-row flex-col md:justify-between md:items-end">
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
                Your AI browser agent that thinks, plans, and acts — all while you watch every move in real time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
