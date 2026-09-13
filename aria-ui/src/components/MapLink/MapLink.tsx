"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ClickIndicator from "./ClickIndicator";

const MapLink = () => {
  const [active, setActive] = useState(false);
  const router = useRouter();

  return (
    <section className="w-screen h-[90vh] bg-[#181717] flex flex-col justify-center items-center text-center">
      <div>
        <p className="text-[0.7rem] font-bold text-[#a79c8d] choose-subtitle">
          No install. No extension.
        </p>

        <h1 className="text-[5vw] leading-15 tracking-tight mt-5 text-[#f4efe7]">
          ARIA runs entirely in<br />
          your browser — powered<br />
        </h1>
      </div>

      <ClickIndicator active={active} />

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          router.push("/dashboard");
        }}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        className="text-[#b1a696] text-[5vw] underline hover:text-[#f4efe7] cursor-pointer"
      >
        with advanced AI intelligence.
      </a>
    </section>
  );
};

export default MapLink;
