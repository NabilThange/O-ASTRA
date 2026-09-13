"use client";
import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@/styles/gallery.css";
import { BsFillPlusCircleFill } from "react-icons/bs";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const Gallery = () => {
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tl4 = gsap.timeline({
      scrollTrigger: {
        trigger: ".gallery-page4",
        start: "10% 10%",
        end: "220% 30%",
        scrub: 1,
        pin: true,
      },
    });

    tl4.to(".gallery-page4", { backgroundColor: "#181717" }, "start");

    gsap.set(
      ".gallery-topText h4, .gallery-topText h3, .gallery-bottomText h3",
      { opacity: 1, x: 0 }
    );

    tl4
      .to(".gallery-box h3", { opacity: 0 }, "a")
      .to(
        ".gallery-page4 .gallery-background",
        {
          width: "calc(100vw - 1rem)",
          height: "calc(100vh - 1rem)",
          borderRadius: "3.5rem",
          y: -40,
        },
        "a"
      )
      .to(".gallery-page4 .gallery-background img", { transform: "scale(1)" }, "a")
      .from(
        ".gallery-background .gallery-topText h4, .gallery-background .gallery-topText h3, .gallery-background .gallery-bottomText h3",
        { opacity: 0, x: 50 }
      )
      .to({}, { duration: 0.4 }, "+=0")
      .to("#gallery-second", { transform: "translate(-50%, -56%)" }, "b")
      .to("#gallery-second img", { transform: "scale(1)" }, "b")
      .to(".gallery-page4 .gallery-background", { scale: 0.9, opacity: 0, y: -50 }, "b")
      .from(
        "#gallery-second .gallery-topText h4, #gallery-second .gallery-topText h3, #gallery-second .gallery-bottomText h3",
        { opacity: 0, x: 50 }
      )
      .to({}, { duration: 0.4 }, "+=0")
      .to("#gallery-third", { transform: "translate(-50%, -56%)" }, "c")
      .to("#gallery-third img", { transform: "scale(1)" }, "c")
      .to("#gallery-second", { scale: 0.9, opacity: 0 }, "c")
      .from(
        "#gallery-third .gallery-topText h4, #gallery-third .gallery-topText h3, #gallery-third .gallery-bottomText h3",
        { opacity: 0, x: 50 }
      )
      .to({}, { duration: 0.4 }, "+=0");

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const generateARIA = (quantity = 6) => {
    const items = [];
    for (let i = 1; i <= quantity; i++) {
      items.push(
        <h3
          key={i}
          style={{ ["--index" as string]: i }}
          className="tracking-tighter"
        >
          ARIA™
        </h3>
      );
    }
    return items;
  };

  return (
    <section className="gallery-page4" ref={pageRef} style={{ backgroundColor: '#2b2825' }}>
      <div className="gallery-slider">
        <div
          className="gallery-box"
          style={
            { "--time": "40s", "--quantity": 6 } as React.CSSProperties
          }
        >
          {generateARIA(6)}
        </div>
      </div>

      <div className="gallery-background">
        <Image src="/assets/background1.png" alt="Intent Phase" fill style={{ objectFit: "cover" }} />
        <div className="gallery-topText">
          <h4>Intent Phase</h4>
          <h3>Understand your goal</h3>
        </div>
        <div className="gallery-bottomText">
          <div className="w-full flex justify-center items-center gap-0">
            <BsFillPlusCircleFill className="w-8 h-8 text-[#b1a696]" />
            <h3>ARIA analyzes your goal for clarity. If it&apos;s ambiguous, <br /> it asks one targeted question to nail down your intent.</h3>
          </div>
          <div className="relative z-9 w-50 h-[0.1rem] bg-[#4f4b48]">
            <div className="progress-line absolute z-10 bg-[#f4efe7] w-[33%] h-[0.1rem] top-1/2 -translate-y-1/2 left-0"></div>
          </div>
        </div>
      </div>

      <div id="gallery-second" className="gallery-background2">
        <Image src="/assets/background2.png" alt="Plan Phase" fill style={{ objectFit: "cover" }} />
        <div className="gallery-topText">
          <h4>Plan Phase</h4>
          <h3>Build & approve</h3>
        </div>
        <div className="gallery-bottomText">
          <div className="w-full flex justify-center items-center gap-0">
            <BsFillPlusCircleFill className="w-8 h-8 text-[#b1a696]" />
            <h3>ARIA generates a detailed action plan. Review it, edit steps, <br /> reorder them, or approve as-is. Nothing runs without your OK.</h3>
          </div>
          <div className="relative z-9 w-50 h-[0.1rem] bg-[#4f4b48]">
            <div className="progress-line absolute z-10 bg-[#f4efe7] w-[66%] h-[0.1rem] top-1/2 -translate-y-1/2 left-0"></div>
          </div>
        </div>
      </div>

      <div id="gallery-third" className="gallery-background2">
        <Image src="/assets/background4.png" alt="Execution Phase" fill style={{ objectFit: "cover" }} />
        <div className="gallery-topText">
          <h4>Execution Phase</h4>
          <h3>Watch & verify</h3>
        </div>
        <div className="gallery-bottomText">
          <div className="w-full flex justify-center items-center gap-0">
            <BsFillPlusCircleFill className="w-8 h-8 text-[#b1a696]" />
            <h3>Watch ARIA execute in a live browser stream. Every action <br /> is verified in real time. Errors? ARIA recovers automatically.</h3>
          </div>
          <div className="relative z-9 w-50 h-[0.1rem] bg-[#4f4b48]">
            <div className="progress-line absolute z-10 bg-[#f4efe7] w-[100%] h-[0.1rem] top-1/2 -translate-y-1/2 left-0"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
