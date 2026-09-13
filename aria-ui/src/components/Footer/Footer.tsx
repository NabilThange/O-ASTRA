"use client";
import { FaBehance, FaInstagram, FaGithub } from "react-icons/fa";
import { CiLinkedin } from "react-icons/ci";
import MarqueeText from "../Marquee/MarqueeText";

const Footer = () => {
  return (
    <section className="w-screen h-dvh px-6 mt-10">
      <p className="text-[.7rem] text-[#eae5dd] choose-subtitle mt-10">
        Ready to try the AI browser agent<br />
        that actually shows you what it&apos;s doing?
      </p>
      <div>
        <MarqueeText />
      </div>

      <div className="flex justify-between items-center text-2xl mt-14">
        <h3 className="text-[#b1a696]">
          ARIA was built to prove that<br />
          AI agents don&apos;t have to be<br />
          black boxes.<br /><br />
          Powered by cutting-edge AI and<br />
          modern web technologies —<a href="#" className="text-[#f4efe7] hover:text-[#c4c1b9] underline"> explore the stack.</a>
        </h3>

        <div className="flex flex-col justify-center items-end">
          <a href="#" className="text-[#f2ede5] text-2xl">Overview</a>
          <a href="#" className="text-[#f2ede5] text-2xl">How it works</a>
          <a href="#" className="text-[#f2ede5] text-2xl">The pipeline</a>
          <a href="#" className="text-[#f2ede5] text-2xl">Why ARIA™</a>
          <a href="#" className="text-[#f2ede5] text-2xl">Scenarios</a>
          <a href="#" className="text-[#f2ede5] text-2xl">Feedback</a>
        </div>
      </div>

      <div className="w-full flex justify-between items-center mt-20">
        <div className="flex justify-center items-center gap-1">
          <div className="border-[1px] border-[#c4c1b9] rounded-full p-3 text-[#f2ede5]"><FaBehance className="text-xl" /></div>
          <div className="border-[1px] border-[#c4c1b9] rounded-full p-3 text-[#f2ede5]"><FaInstagram className="text-xl" /></div>
          <div className="border-[1px] border-[#c4c1b9] rounded-full p-3 text-[#f2ede5]"><CiLinkedin className="text-xl" /></div>
          <div className="border-[1px] border-[#c4c1b9] rounded-full p-3 text-[#f2ede5]"><FaGithub className="text-xl" /></div>
        </div>

        <div>
          <p className="text-[0.8rem] text-[#b1a696] text-right">
            ARIA™ — Autonomous Real-time<br />
            Intelligence Agent. Open-source AI.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Footer;
