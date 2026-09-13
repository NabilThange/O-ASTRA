"use client";

import gsap, { ScrollTrigger, SplitText } from "gsap/all";
import { useGSAP } from "@gsap/react";
import { useState } from "react";

const StickyCols = () => {

    const [reveal, setReveal] = useState(false);

    useGSAP(() => {
        // Safety check for SSR
        if (typeof window === 'undefined') return;
        
        gsap.registerPlugin(ScrollTrigger);

        // TEMPORARILY DISABLED - SplitText causes React hydration issues
        // Text animations simplified to work without DOM manipulation
        // const textElements = document.querySelectorAll(".col-3 h1, .col-3 p");
        // textElements.forEach((element) => {
        //     const split = new SplitText(element, { type: "lines", linesClass: "line" });
        //     split.lines.forEach((line) => {
        //         line.innerHTML = `<span>${line.textContent}</span>`;
        //     });
        // });

        // Refresh ScrollTrigger
        ScrollTrigger.refresh();

        // Simplified animations without SplitText
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".sticky-cols",
                start: "top 20%",
                end: "+=90%",
                pin: true,
                scrub: 1,
                // markers: true,
            },
        });
        tl.add(() => setReveal(false));
        // PHASE 1: Reveal col-2, hide col-1
        tl.to(".col-1", { opacity: 0, scale: 0.8, duration: 0.8 })
            .to(".col-2", { x: "0%", duration: 0.8 }, "<")
            .to(".col-3", { y: "0%", duration: 0.8 }, "<")
            .to(".col-img-1 img", { scale: 1, duration: 0.8 }, "<")
            .to(".col-img-2", {
                clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                duration: 0.8,
            }, "<")
            .to(".col-img-2 img", { scale: 1.6, duration: 0.8 }, "<")

        tl.add(() => setReveal(false));
        tl.add(() => setReveal(true));
        // PHASE 2: Switch col-2 -> col-3 content (simplified without SplitText)
        tl.to(".col-2", { opacity: 0, scale: 0.8, duration: 0.8 })
            .to(".col-3 .col-content-wrapper", {
                opacity: 0,
                duration: 0.8,
            }, "<")
        tl.to(".col-3", { x: "0%", duration: 0.8 }, "-=0.8")
            .to(".col-4", { y: "0%", duration: 0.8 }, "<")
            .to(".col-3 .col-content-wrapper-2", {
                opacity: 1,
                delay: 0.4,
                duration: 0.8,
            }, "<");

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
                            <h1 className="text-2xl text-[#b1a696] font-bold leading-auto">Enjoy the view
                                <br />
                                through—the wide
                                <br />
                                panoramic glass
                                <br />
                                window
                            </h1>
                            <div className="col-content-para flex items-center gap-4 justify-between">
                                <div className="flex items-center gap-0 justify-center">
                                    <h3 className="border-1 px-3 py-1 rounded-full text-[#aaa091]">1</h3>
                                    <h3 className="border-1 px-3 py-1 rounded-full text-[#524e4b]">3</h3>
                                </div>
                                <p className={`text-[12px] font-medium  ${!reveal ? "mr-6" : "mr-0"}`}> Experience browser automation with unprecedented transparency
                                    <br />
                                    and admire this unique, breathtaking landscape.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="col col-2">
                    <div className="col-img col-img-1">
                        <div className="col-img-wrapper">
                            <img src="/aria-assets/cap1-square.jpg" alt="img" />
                        </div>
                    </div>
                    <div className="col col-img-2 p-2">
                        <div className="col-img-wrapper">
                            <img src="/aria-assets/cap2-square.jpg" alt="img" />
                        </div>
                    </div>
                </div>
                <div className="col col-3">
                    <div className="col-content-wrapper">
                        <h1 className="text-2xl font-bold leading-auto">Enjoy the view
                            <br />
                            through—the wide
                            <br />
                            panoramic glass
                            <br />
                            window
                        </h1>
                        <div className={`col-content-para flex items-center gap-4 justify-between ${reveal ? "ml-0" : "ml-6"}`}>
                            <div className="flex items-center gap-0 justify-center">
                                <h3 className="border-1 px-3 py-1 rounded-full text-[#aaa091]">{(reveal) ? "3" : "2"}</h3>
                                <h3 className="border-1 px-3 py-1 rounded-full text-[#524e4b]">3</h3>
                            </div>
                            <p className="text-[12px] font-medium"> Experience browser automation with unprecedented transparency
                                <br />
                                and admire this unique, breathtaking landscape.
                            </p>
                        </div>
                    </div>
                    <div className="col-content-wrapper-2">
                        <h1 className="text-2xl font-bold leading-auto">Enjoy the view
                            <br />
                            through—the wide
                            <br />
                            panoramic glass
                            <br />
                            window
                        </h1>
                        <div className="col-content-para flex items-center gap-4 justify-between">
                            <div className="flex items-center gap-0 justify-center">
                                {/* <h3 className="border-1 px-3 py-1 rounded-full text-[#aaa091]">3</h3>
                                <h3 className="border-1 px-3 py-1 rounded-full text-[#524e4b]">3</h3> */}
                            </div>
                            <p className={`text-[12px] font-medium  ${!reveal ? "mr-0" : "mr-6"}`}> Experience browser automation with unprecedented transparency
                                <br />
                                and admire this unique, breathtaking landscape.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col col-4">
                    <div className="col-img col-img-1">
                        <div className="col-img-wrapper">
                            <img src="/aria-assets/cap1-square.jpg" alt="img" />
                        </div>
                    </div>
                </div>
            </div>

        </section>
    );
};

export default StickyCols;