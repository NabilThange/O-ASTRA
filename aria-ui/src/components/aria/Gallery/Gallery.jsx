"use client";

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './gallery.css';
import { BsFillPlusCircleFill } from "react-icons/bs";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const Gallery = () => {
    const pageRef = useRef(null);

    useEffect(() => {
        // Safety check for SSR
        if (typeof window === 'undefined') return;

        // Wait for next tick to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            // Create new timeline
            const tl4 = gsap.timeline({
                scrollTrigger: {
                    trigger: ".gallery-page4",
                    start: "10% 10%",
                    end: "220% 30%",
                    scrub: 1,
                    pin: true,
                }
            });

        // Add background color animation
        tl4.to(".gallery-page4", {
            backgroundColor: "#181717",
        }, 'start');

        gsap.set(".gallery-topText h4, .gallery-topText h3, .gallery-bottomText h3", {
            opacity: 1,
            x: 0
        });

        // Animation sequence
        tl4.to(".gallery-box h3", {
            opacity: 0,
        }, 'a')
            .to(".gallery-page4 .gallery-background", {
                width: "calc(100vw - 1rem)",
                height: "calc(100vh - 1rem)",
                borderRadius: "3.5rem",
                y: -40,
            }, 'a')
            .to(".gallery-page4 .gallery-background img", {
                transform: "scale(1)",
            }, 'a')
            .from(".gallery-background .gallery-topText h4, .gallery-background .gallery-topText h3, .gallery-background .gallery-bottomText h3", {
                opacity: 0,
                x: 50,
            })
            .to({}, { duration: 0.4 }, "+=0")

            .to("#gallery-second", {
                transform: "translate(-50%, -56%)",
            }, 'b')
            .to("#gallery-second img", {
                transform: "scale(1)",
            }, 'b')
            .to(".gallery-page4 .gallery-background", {
                scale: 0.9,
                opacity: 0,
                y: -50
            }, 'b')
            .from("#gallery-second .gallery-topText h4, #gallery-second .gallery-topText h3, #gallery-second .gallery-bottomText h3", {
                opacity: 0,
                x: 50,
            })
            .to({}, { duration: 0.4 }, "+=0")
            .to("#gallery-third", {
                transform: "translate(-50%, -56%)",
            }, 'c')
            .to("#gallery-third img", {
                transform: "scale(1)",
            }, 'c')
            .to("#gallery-second", {
                scale: 0.9,
                opacity: 0,
            }, 'c')
            .from("#gallery-third .gallery-topText h4, #gallery-third .gallery-topText h3, #gallery-third .gallery-bottomText h3", {
                opacity: 0,
                x: 50,
            })
            .to({}, { duration: 0.4 }, "+=0");

        // Clean up function - only kill this component's ScrollTrigger
        return () => {
            if (tl4 && tl4.scrollTrigger) {
                tl4.scrollTrigger.kill();
            }
            tl4.kill();
        };
        }, 100); // Small delay to ensure DOM is ready

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    // Generate repeating Aria® elements
    const generateArias = (quantity = 6) => {
        const arias = [];
        for (let i = 1; i <= quantity; i++) {
            arias.push(
                <h3 key={i} style={{ "--index": i }} className='tracking-tighter'>
                    Aria®
                </h3>
            );
        }
        return arias;
    };

    return (
        <section className="gallery-page4" ref={pageRef} style={{ backgroundColor: '#2b2825' }}>
            <div className="gallery-slider">
                <div
                    className="gallery-box"
                    style={{ "--time": "40s", "--quantity": 6 }}
                >
                    {generateArias(6)}
                </div>
            </div>

            <div className="gallery-background">
                <img src="/aria-assets/background1.png" alt="Classic Aria" />
                <div className="gallery-topText">
                    <h4>Intent Layer®</h4>
                    <h3>(Scroll)</h3>
                </div>
                <div className="gallery-bottomText">
                    <div className='w-full flex justify-center items-center gap-0'>
                        <BsFillPlusCircleFill className='w-8 h-8 text-[#b1a696]' />
                        <div>ARIA® combines transparent execution with real-time feedback,<br />creating a collaborative experience for browser automation</div>
                    </div>
                    <div className="relative z-[9] w-50 h-[0.1rem] bg-[#4f4b48]">
                        <div className="progress-line absolute z-10 bg-[#f4efe7] w-[33%] h-[0.1rem] top-1/2 -translate-y-1/2 left-0"></div>
                    </div>
                </div>
            </div>

            <div id="gallery-second" className="gallery-background2">
                <img src="/aria-assets/background2.png" alt="Planner Layer" />
                <div className="gallery-topText">
                    <h4>Planner Layer®</h4>
                    <h3>(Scroll)</h3>
                </div>
                <div className="gallery-bottomText">
                    <div className='w-full flex justify-center items-center gap-0'>
                        <BsFillPlusCircleFill className='w-8 h-8 text-[#b1a696]' />
                        <div>ARIA® combines transparent execution with real-time feedback,<br />creating a collaborative experience for browser automation</div>
                    </div>
                    <div className="relative z-[9] w-50 h-[0.1rem] bg-[#4f4b48]">
                        <div className="progress-line absolute z-10 bg-[#f4efe7] w-[67%] h-[0.1rem] top-1/2 -translate-y-1/2 left-0"></div>
                    </div>
                </div>
            </div>

            <div id="gallery-third" className="gallery-background2">
                <img src="/aria-assets/background3.png" alt="ARIA Pipeline" />
                <div className="gallery-topText">
                    <h4>ARIA Pipeline®</h4>
                    <h3>(Scroll)</h3>
                </div>
                <div className="gallery-bottomText">
                    <div className='w-full flex justify-center items-center gap-0'>
                        <BsFillPlusCircleFill className='w-8 h-8 text-[#b1a696]' />
                        <div>ARIA® combines transparent execution with real-time feedback,<br />creating a collaborative experience for browser automation</div>
                    </div>
                    <div className="relative z-[9] w-50 h-[0.1rem] bg-[#4f4b48]">
                        <div className="progress-line absolute z-10 bg-[#f4efe7] w-[100%] h-[0.1rem] top-1/2 -translate-y-1/2 left-0"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Gallery;
