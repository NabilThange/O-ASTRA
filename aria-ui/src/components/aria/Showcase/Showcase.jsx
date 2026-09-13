"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ScrollToPlugin from "gsap/ScrollToPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const Showcase = () => {
    const containerRef = useRef(null);
    const imgConRef = useRef(null);

    useGSAP(() => {
        // Safety check for SSR
        if (typeof window === 'undefined') return;
        if (!imgConRef.current || !containerRef.current) return;

        // ✅ TARGET ONLY INNER IMAGES (NOT OUTER DIV)
        const images = gsap.utils.toArray(".image-item");

        const totalWidth =
            imgConRef.current.scrollWidth - containerRef.current.offsetWidth;

        let lastScroll = window.scrollY;
        let velocity = 0;

        // ✅ Horizontal scroll animation (unchanged)
        gsap.to(imgConRef.current, {
            x: () => -totalWidth,
            ease: "none",
            scrollTrigger: {
                trigger: containerRef.current,
                start: "-10% 10%",
                end: () => `+=${totalWidth}`,
                scrub: true,
                pin: true,
                // invalidateOnRefresh: true,
                // markers: true,

                // onUpdate: () => {
                //     const currentScroll = window.scrollY;
                //     velocity = currentScroll - lastScroll;
                //     lastScroll = currentScroll;

                //     // ✅ Smooth limited movement (no gap, no break)
                //     const move = gsap.utils.clamp(
                //         -60,
                //         60,
                //         velocity * 2.2
                //     );

                //     images.forEach((img, index) => {
                //         gsap.to(img, {
                //             x: move * (index % 2 === 0 ? 1 : -1),
                //             duration: 0.4,
                //             ease: "power3.out",
                //             overwrite: "auto"
                //         });
                //     });
                // }
            }
        });
    }, { scope: containerRef });

    return (
        <section
            ref={containerRef}
            className='relative w-full h-dvh overflow-hidden mt-20'
            style={{ backgroundColor: '#181717' }}
        >
            <div
                ref={imgConRef}
                className="absolute top-0 left-0 h-full flex items-center justify-start gap-2 p-2 overflow-hidden"
            >
                {/* Image 1 */}
                <div className="relative flex-shrink-0 w-[80vw] h-full overflow-hidden">
                    <div className="w-[77vw] absolute top-10 left-5 flex justify-between items-start text-[#f4efe7]">
                        <h1 className="text-3xl font-bold">Intent<br /> Understanding</h1>
                        <p className="border-[1px] rounded-3xl px-2 py-1 text-center text-[0.7rem]">Layer 1</p>
                    </div>
                    <Image
                        src="/aria-assets/activities-1.png"
                        alt="Activity 1"
                        fill
                        className="image-item object-cover rounded-[2.5rem]"
                        priority={false}
                        loading="lazy"
                        sizes="80vw"
                    />
                    <div className="w-[77vw] absolute bottom-10 left-5 flex justify-between items-start ">
                        <p className="text-[0.68rem] font-bold text-[#f4efe7]">ARIA clarifies ambiguous goals by asking smart follow-up<br />questions before building an execution plan.</p>
                        <div className="flex justify-center items-center">
                            <p className="text-[#f4efe7] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">01</p>
                            <p className="text-[#4e484e] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
                        </div>
                    </div>
                </div>

                {/* Image 2 */}
                <div className="relative flex-shrink-0 w-[80vw] h-full overflow-hidden">
                    <div className="w-[77vw] absolute top-10 left-5 flex justify-between items-start text-[#f4efe7]">
                        <h1 className="text-3xl font-bold">Plan<br />Approval</h1>
                        <p className="border-[1px] rounded-3xl px-2 py-1 text-center text-[0.7rem]">Layer 2</p>
                    </div>
                    <Image
                        src="/aria-assets/activities-2.png"
                        alt="Activity 2"
                        fill
                        className="image-item object-cover rounded-[2.5rem]"
                        priority={false}
                        loading="lazy"
                        sizes="80vw"
                    />
                    <div className="w-[77vw] absolute bottom-10 left-5 flex justify-between items-start ">
                        <p className="text-[0.68rem] font-bold text-[#f4efe7]">You approve the step-by-step plan before any browser<br />actions are executed—full transparency and control.</p>
                        <div className="flex justify-center items-center">
                            <p className="text-[#f4efe7] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">02</p>
                            <p className="text-[#4e484e] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
                        </div>
                    </div>
                </div>

                {/* Image 3 */}
                <div className="relative flex-shrink-0 w-[80vw] h-full overflow-hidden">
                    <div className="w-[77vw] absolute top-10 left-5 flex justify-between items-start text-[#f4efe7]">
                        <h1 className="text-3xl font-bold">Live<br /> Execution</h1>
                        <p className="border-[1px] rounded-3xl px-2 py-1 text-center text-[0.7rem]">Layer 3</p>
                    </div>
                    <Image
                        src="/aria-assets/activities-3.png"
                        alt="Activity 3"
                        fill
                        className="image-item object-cover rounded-[2.5rem]"
                        priority={false}
                        loading="lazy"
                        sizes="80vw"
                    />
                    <div className="w-[77vw] absolute bottom-10 left-5 flex justify-between items-start ">
                        <p className="text-[0.68rem] font-bold text-[#f4efe7]">Watch ARIA execute tasks live in a sandboxed browser<br />with WebRTC streaming and pixel-perfect precision.</p>
                        <div className="flex justify-center items-center">
                            <p className="text-[#f4efe7] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
                            <p className="text-[#4e484e] border-[1px] rounded-3xl px-[1vw] py-1 text-center text-[0.7rem]">03</p>
                        </div>
                    </div>
                </div>

                {/* Extra space */}
                {/* <div className="flex-shrink-0 w-[2%]"></div> */}
            </div>
        </section>
    );
};

export default Showcase;
