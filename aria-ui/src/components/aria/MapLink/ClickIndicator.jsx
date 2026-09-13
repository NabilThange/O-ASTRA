"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./overlay.css";
import { MdArrowOutward } from "react-icons/md";

const ClickIndicator = ({ active }) => {
    const ref = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Ensure we're on the client before mounting
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const move = (e) => {
            if (!active || !ref.current) return;

            const el = ref.current;
            const w = el.offsetWidth;
            const h = el.offsetHeight;

            el.style.left = `${e.clientX - w / 2}px`;
            el.style.top = `${e.clientY - h / 2}px`;
        };

        document.addEventListener("mousemove", move);
        return () => document.removeEventListener("mousemove", move);
    }, [active, mounted]);

    // Don't render portal until mounted on client
    if (!active || !mounted || typeof document === 'undefined') return null;

    return createPortal(
        <Link href="/dashboard">
            <div ref={ref} className="click-indicator visible text-[0.7rem] px-3 py-2 rounded-4xl cursor-pointer">
                <div className="w-auto bg-[#f4efe7] flex justify-center items-center gap-3">
                    <span>Go to Dashboard</span>
                    <MdArrowOutward className="bg-[#2a2725] text-[#b3a694] w-[3rem] h-[3rem] rounded-full p-1" />
                </div>
            </div>
        </Link>,
        document.body
    );
};

export default ClickIndicator;