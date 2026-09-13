"use client";

import React from "react";
import { FaBehance, FaInstagram, FaGithub } from "react-icons/fa";
import { CiLinkedin } from "react-icons/ci";
import MarqueeText from "../Marquee/MarqueeText";

const Footer = () => {
  return (
    <section className="w-full min-h-screen px-6 mt-10 flex flex-col justify-between">
      <div>
        <p className="text-[.75rem] text-[#eae5dd] tracking-wider uppercase opacity-80 mt-10">
          Ready to try the AI browser agent<br />
          that actually shows you what it&apos;s doing?
        </p>
        <div className="my-10">
          <MarqueeText />
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-xl md:text-2xl mt-14 gap-8">
        <h3 className="text-[#b1a696] max-w-xl font-light leading-relaxed">
          ARIA was built to prove that<br />
          AI agents don&apos;t have to be<br />
          black boxes.<br /><br />
          Powered by cutting-edge AI and<br />
          modern web technologies —{" "}
          <a
            href="https://github.com/bytebot-ai/bytebot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f4efe7] hover:text-[#c4c1b9] underline underline-offset-4"
          >
            explore the stack.
          </a>
        </h3>

        <div className="flex flex-col items-start md:items-end gap-2">
          <a href="#overview" className="text-[#f2ede5] hover:text-[#b1a696] text-xl md:text-2xl transition-colors">
            Overview
          </a>
          <a href="#welcome" className="text-[#f2ede5] hover:text-[#b1a696] text-xl md:text-2xl transition-colors">
            How it works
          </a>
          <a href="#choose" className="text-[#f2ede5] hover:text-[#b1a696] text-xl md:text-2xl transition-colors">
            Why ARIA™
          </a>
          <a href="#gallery" className="text-[#f2ede5] hover:text-[#b1a696] text-xl md:text-2xl transition-colors">
            Scenarios
          </a>
          <a href="#feedback" className="text-[#f2ede5] hover:text-[#b1a696] text-xl md:text-2xl transition-colors">
            Feedback
          </a>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row justify-between items-center my-16 gap-6 pt-10 border-t border-[#33302c]">
        <div className="flex items-center gap-3">
          <a
            href="https://behance.net"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#c4c1b9]/40 rounded-full p-3 text-[#f2ede5] hover:border-[#f2ede5] hover:scale-110 transition-all"
          >
            <FaBehance className="text-xl" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#c4c1b9]/40 rounded-full p-3 text-[#f2ede5] hover:border-[#f2ede5] hover:scale-110 transition-all"
          >
            <FaInstagram className="text-xl" />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#c4c1b9]/40 rounded-full p-3 text-[#f2ede5] hover:border-[#f2ede5] hover:scale-110 transition-all"
          >
            <CiLinkedin className="text-xl" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#c4c1b9]/40 rounded-full p-3 text-[#f2ede5] hover:border-[#f2ede5] hover:scale-110 transition-all"
          >
            <FaGithub className="text-xl" />
          </a>
        </div>

        <div>
          <p className="text-[0.8rem] text-[#b1a696] text-center sm:text-right tracking-wide leading-relaxed">
            ARIA™ — Autonomous Real-time<br />
            Intelligence Agent. Open-source AI.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Footer;
